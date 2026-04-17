import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Decimal } from 'decimal.js';
import * as crypto from 'crypto';
import { CreateOrderDto } from './orders.schemas';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        prixVente: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((product) => product.id);
      const missing = productIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Unknown product IDs: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      const unitPrice = new Decimal(product.prixVente);
      const quantity = new Decimal(item.quantity);
      const totalPrice = unitPrice.times(quantity);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        packageCode: this.generatePackageCode(),
        deliveryType: dto.deliveryType,
      };
    });

    const productSubTotal = orderItems.reduce(
      (sum, item) => sum.plus(new Decimal(item.totalPrice)),
      new Decimal(0),
    );
    const deliveryFee = new Decimal(dto.distanceKm).times(100).toDecimalPlaces(2);
    const gatewayFee = productSubTotal
      .plus(deliveryFee)
      .times(0.03)
      .toDecimalPlaces(0, Decimal.ROUND_UP);
    const totalAmount = productSubTotal.plus(deliveryFee).plus(gatewayFee);
    const netAmount = totalAmount.minus(gatewayFee);

    const order = await this.prisma.order.create({
      data: {
        resellerId: dto.resellerId ?? null,
        status: 'PENDING',
        totalAmount,
        productSubTotal,
        deliveryFee,
        gatewayFee,
        netAmount,
        escrowBalance: totalAmount,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        deliveryAddress: dto.deliveryAddress,
        deliveryType: dto.deliveryType,
        estimatedDelivery: null,
        notes: null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  }

  private generatePackageCode() {
    const date = new Date();
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const suffix = crypto.randomBytes(2).toString('hex').slice(0, 4).toUpperCase();
    return `${year}${month}${day}-${suffix}`;
  }
}
