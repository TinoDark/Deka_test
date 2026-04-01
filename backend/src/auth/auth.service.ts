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
}
