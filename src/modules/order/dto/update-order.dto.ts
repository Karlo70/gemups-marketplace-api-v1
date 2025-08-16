import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus, PaymentStatus } from '../entities/order.entity';
import { IsEnum } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @IsEnum(PaymentStatus)
    payment_status: PaymentStatus; 
}
