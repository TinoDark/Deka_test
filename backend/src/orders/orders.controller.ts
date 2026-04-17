import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaymentsService } from '../payments/payments.service';
import { Public } from '@/common/decorators/public.decorator';
import { CreateOrderSchema } from './orders.schemas';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  @Public()
  @Post()
  async createOrder(@Body() body: any) {
    try {
      const validated = CreateOrderSchema.parse(body);
      const order = await this.ordersService.createOrder(validated);

      if (validated.paymentMethod === 'mobile_money') {
        const paymentResult = await this.paymentsService.initiatePayGateGlobalPayment(
          order.id,
          'payment_page',
        );

        return {
          order,
          payment: paymentResult,
        };
      }

      return {
        order,
        payment: null,
      };
    } catch (error: any) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create order',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
