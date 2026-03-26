// Prisma migration seed - Initial data
import { PrismaClient, UserRole, KYCStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.refund.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@deka.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      phone: '+1234567890',
      firstName: 'Admin',
      lastName: 'Deka',
      role: UserRole.ADMIN,
      kycStatus: KYCStatus.APPROVED,
      isActive: true,
    },
  });
  console.log('✅ Created admin:', adminUser.email);

  // Create supplier users
  const supplier1 = await prisma.user.create({
    data: {
      email: 'supplier1@deka.com',
      passwordHash: await bcrypt.hash('supplier123', 10),
      phone: '+1111111111',
      firstName: 'John',
      lastName: 'Supplier',
      role: UserRole.SUPPLIER,
      kycStatus: KYCStatus.APPROVED,
      isActive: true,
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      email: 'supplier2@deka.com',
      passwordHash: await bcrypt.hash('supplier123', 10),
      phone: '+2222222222',
      firstName: 'Jane',
      lastName: 'Supplier',
      role: UserRole.SUPPLIER,
      kycStatus: KYCStatus.APPROVED,
      isActive: true,
    },
  });
  console.log('✅ Created suppliers');

  // Create reseller users
  const reseller1 = await prisma.user.create({
    data: {
      email: 'reseller1@deka.com',
      passwordHash: await bcrypt.hash('reseller123', 10),
      phone: '+3333333333',
      firstName: 'Alice',
      lastName: 'Reseller',
      role: UserRole.RESELLER,
      kycStatus: KYCStatus.APPROVED,
      walletBalance: 50000,
      isActive: true,
    },
  });
  console.log('✅ Created resellers');

  // Create products
  const product1 = await prisma.product.create({
    data: {
      supplierId: supplier1.id,
      name: 'iPhone 15 Pro',
      description: 'Latest Apple smartphone',
      wholesalePrice: 400,
      retailPrice: 599,
      stock: 100,
      isActive: true,
      category: 'Electronics',
      sku: 'IP15-PRO-001',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      supplierId: supplier1.id,
      name: 'AirPods Pro',
      description: 'Wireless earbuds',
      wholesalePrice: 100,
      retailPrice: 249,
      stock: 200,
      isActive: true,
      category: 'Electronics',
      sku: 'AP-PRO-001',
    },
  });

  const product3 = await prisma.product.create({
    data: {
      supplierId: supplier2.id,
      name: 'Samsung Galaxy S24',
      description: 'Latest Samsung flagship',
      wholesalePrice: 350,
      retailPrice: 499,
      stock: 150,
      isActive: true,
      category: 'Electronics',
      sku: 'SG-S24-001',
    },
  });
  console.log('✅ Created products');

  console.log('✨ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
