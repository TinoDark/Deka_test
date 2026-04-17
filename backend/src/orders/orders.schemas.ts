import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().uuid().describe('Product UUID'),
  quantity: z.number().int().min(1).describe('Quantity for the product'),
});

export const CreateOrderSchema = z.object({
  resellerId: z.string().uuid().optional().describe('Optional reseller UUID'),
  customerEmail: z.string().email().describe('Customer email'),
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/)
    .min(7)
    .max(20)
    .describe('Customer phone number'),
  deliveryAddress: z.string().min(10).describe('Delivery address'),
  deliveryType: z
    .enum(['DIRECT', 'HUB'])
    .default('DIRECT')
    .describe('Delivery type'),
  distanceKm: z.number().positive().describe('Delivery distance in kilometers'),
  paymentMethod: z
    .enum(['mobile_money', 'cash_on_delivery'])
    .default('mobile_money')
    .describe('Payment method'),
  items: z.array(OrderItemSchema).min(1).describe('Order line items'),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
