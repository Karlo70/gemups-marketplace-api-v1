import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { GetAllOrder } from './dto/get-all-order.dto';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { SevenElevenProxiesService } from '../seven-eleven-proxies/seven-eleven-proxies.service';
import { CryptomusService } from '../cryptomus/cryptomus.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../transaction/entities/transaction.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    private sevenElevenProxiesService: SevenElevenProxiesService,
    private cryptomusService: CryptomusService,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    if (!user.cryptomus_wallet) {
      throw new BadRequestException('You do not have a cryptomus wallet');
    }

    // Validate all products exist
    const productIds = createOrderDto.items.map(item => item.product_id);
    const products = await this.productRepository.find({ where: { id: In(productIds) } });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
    }

    // Create order
    const order = this.orderRepository.create({
      user: user,
      notes: createOrderDto.notes,
      metadata: createOrderDto.metadata,
      subtotal: 0,
      total_amount: 0,
      final_amount: 0,
      total_items: 0,
      status: OrderStatus.COMPLETED,
      payment_status: PaymentStatus.PAID,
    });

    // Save order first to get the ID
    const savedOrder = await this.orderRepository.save(order);

    // Create order items and calculate totals
    let subtotal = 0;
    let totalItems = 0;
    const orderItems: OrderItem[] = [];

    for (const itemDto of createOrderDto.items) {
      const product = products.find(p => p.id === itemDto.product_id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${itemDto.product_id} not found`);
      }

      const totalPrice = (Number(product.price_per_ip) * Number(itemDto.quantity)).toFixed(2);

      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        product: product,
        quantity: itemDto.quantity,
        unit_price: product.price_per_ip,
        total_price: Number(totalPrice),
        metadata: itemDto.metadata,
      });

      orderItems.push(orderItem);
      subtotal += Number(totalPrice);
      totalItems += itemDto.quantity;
    }

    // Save order items
    await this.orderItemRepository.save(orderItems);

    // Update order totals
    savedOrder.subtotal = subtotal;
    savedOrder.total_amount = subtotal;
    savedOrder.final_amount = subtotal;
    savedOrder.total_items = totalItems;

    // Check wallet balance
    if (user.cryptomus_wallet.balance < savedOrder.final_amount) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }

    // Deduct from wallet
    user.cryptomus_wallet.balance = user.cryptomus_wallet.balance - savedOrder.final_amount;
    await user.cryptomus_wallet.save();

    // Create transaction record
    const transaction = this.transactionRepository.create({
      amount: savedOrder.final_amount,
      currency: user.cryptomus_wallet.currency,
      transaction_type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      payment_method: PaymentMethod.CRYPTO,
      description: `Order payment for order #${savedOrder.id}`,
      user: user,
      order: savedOrder,
      metadata: {
        wallet_id: user.cryptomus_wallet.id,
        payment_provider: 'cryptomus',
      },
    });

    // Save transaction
    await transaction.save();

    // Save updated order
    await savedOrder.save()
    return await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }

  async findAll(query: GetAllOrder): Promise<Pagination<Order>> {
    const { page, per_page, search, } = query;
    const queryBuilder = this.orderRepository.createQueryBuilder('order');
    queryBuilder.leftJoinAndSelect('order.user', 'user');
    queryBuilder.leftJoinAndSelect('order.items', 'items');
    queryBuilder.leftJoinAndSelect('items.product', 'product');

    const PaginateOption: IPaginationOptions = {
      page: page || 1,
      limit: per_page || 10,
    }
    return await paginate(queryBuilder, PaginateOption);
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByUser(user: User): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { user: { id: user.id } },
      relations: {
        items: {
          product: true,
        },
      },
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Update order
    Object.assign(order, updateOrderDto);

    // Update timestamps based on status changes
    if (updateOrderDto.status === OrderStatus.COMPLETED && order.status !== OrderStatus.COMPLETED) {
      order.completed_at = new Date();
    }

    if (updateOrderDto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      order.cancelled_at = new Date();
    }

    if (updateOrderDto.payment_status === PaymentStatus.PAID && order.payment_status !== PaymentStatus.PAID) {
      order.paid_at = new Date();
    }

    return await this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.softDelete(id);
  }

  async updatePaymentStatus(id: number, paymentStatus: PaymentStatus, transactionId?: string): Promise<Order> {
    const order = await this.findOne(id);

    order.payment_status = paymentStatus;
    if (transactionId) {
      order.payment_transaction_id = transactionId;
    }

    if (paymentStatus === PaymentStatus.PAID) {
      order.paid_at = new Date();
      order.status = OrderStatus.CONFIRMED;

      // Create transaction record for external payment
      if (transactionId) {
        const transaction = this.transactionRepository.create({
          amount: order.final_amount,
          currency: 'USD',
          transaction_type: TransactionType.PAYMENT,
          status: TransactionStatus.COMPLETED,
          payment_method: PaymentMethod.CRYPTO, // Default to crypto for external payments
          description: `External payment for order #${order.id}`,
          user: order.user,
          order: order,
          metadata: {
            order_id: order.id,
            payment_transaction_id: transactionId,
            payment_method: 'external',
          },
        });

        await transaction.save();
      }
    }

    return await this.orderRepository.save(order);
  }

  async cancelOrder(id: number, reason: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed order');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelled_reason = reason;
    order.cancelled_at = new Date();

    // Create refund transaction if order was paid
    if (order.payment_status === PaymentStatus.PAID) {
      const refundTransaction = this.transactionRepository.create({
        amount: order.final_amount,
        currency: 'USD',
        transaction_type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        payment_method: PaymentMethod.CRYPTO,
        description: `Order cancellation refund for order #${order.id}`,
        user: order.user,
        order: order,
        refunded_amount: order.final_amount,
        refund_reason: reason,
        refunded_at: new Date(),
        metadata: {
          order_id: order.id,
          wallet_id: order.user.cryptomus_wallet.id,
          cancellation_reason: reason,
          original_payment_amount: order.final_amount,
        },
      });

      await refundTransaction.save();
    }

    return await this.orderRepository.save(order);
  }

  async createRefundTransaction(orderId: number, refundAmount: number, reason: string): Promise<Transaction> {
    const order = await this.findOne(orderId);

    if (order.payment_status !== PaymentStatus.PAID) {
      throw new BadRequestException('Order is not paid, cannot create refund');
    }

    if (refundAmount > order.final_amount) {
      throw new BadRequestException('Refund amount cannot exceed order amount');
    }

    const refundTransaction = this.transactionRepository.create({
      amount: refundAmount,
      currency: 'USD',
      transaction_type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      payment_method: PaymentMethod.CRYPTO,
      description: `Partial refund for order #${order.id}`,
      user: order.user,
      order: order,
      refunded_amount: refundAmount,
      refund_reason: reason,
      refunded_at: new Date(),
      metadata: {
        order_id: order.id,
        wallet_id: order.user.cryptomus_wallet.id,
        refund_reason: reason,
        original_order_amount: order.final_amount,
        refund_amount: refundAmount,
        remaining_amount: order.final_amount - refundAmount,
      },
    });

    return await refundTransaction.save();
  }

  async getOrderTransactions(orderId: number): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { order: { id: orderId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    const [total, pending, completed, cancelled] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.COMPLETED } }),
      this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.final_amount)', 'total')
      .where('order.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('order.payment_status = :paymentStatus', { paymentStatus: PaymentStatus.PAID })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult?.total || '0');

    return {
      total,
      pending,
      completed,
      cancelled,
      totalRevenue,
    };
  }
}
