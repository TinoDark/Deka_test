import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// Accept both uppercase and lowercase, normalize to Prisma enum format
type UserRoleType = 'SUPPLIER' | 'RESELLER' | 'DELIVERY' | 'ADMIN' | 'supplier' | 'reseller' | 'delivery' | 'admin';

// Helper function to normalize role to valid Prisma enum
function normalizeRole(role: string): 'SUPPLIER' | 'RESELLER' | 'DELIVERY' | 'ADMIN' {
  const normalized = (role || 'RESELLER').toUpperCase();
  const validRoles = ['SUPPLIER', 'RESELLER', 'DELIVERY', 'ADMIN'];
  if (!validRoles.includes(normalized)) {
    return 'RESELLER';
  }
  return normalized as 'SUPPLIER' | 'RESELLER' | 'DELIVERY' | 'ADMIN';
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return this.generateTokens(user);
  }

  async register(
    email: string,
    password: string,
    phone: string,
    role: UserRoleType = 'RESELLER',
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Normalize role to uppercase (Prisma enum expects uppercase values)
    const normalizedRole = normalizeRole(role);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        phone,
        role: normalizedRole,
      },
    });

    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload as any, {
      expiresIn: process.env.JWT_EXPIRATION || '900s',
    } as any);

    const refreshToken = this.jwtService.sign(payload as any, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    } as any);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        kycStatus: user.kycStatus,
      },
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If email exists, reset link has been sent' };
    }

    // Generate a password reset token (valid for 1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET || 'jwt_secret_key',
      }
    );

    // TODO: Send email with reset link
    // const resetLink = `https://yourdomain.com/reset-password/${resetToken}`;
    // await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    return {
      message: 'Password reset link has been sent to your email',
      // Only for development - remove in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify the reset token
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'jwt_secret_key',
      }) as any;

      // Verify it's a password-reset token
      if (decoded.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      return { message: 'Password has been reset successfully' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset link has expired. Please request a new one.');
      }
      throw new BadRequestException('Invalid or expired reset link');
    }
  }
}
