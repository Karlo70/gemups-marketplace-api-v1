import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../users/entities/user.entity';
import { Product, ProxiesProvider } from '../products/entities/product.entity';
import { GetAllOrder } from './dto/get-all-order.dto';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { SevenElevenProxiesService } from '../seven-eleven-proxies/seven-eleven-proxies.service';
import { ProxySellerService } from '../proxy-seller-proxies/proxy-seller-proxies.service';
import { CryptomusService } from '../cryptomus/cryptomus.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../transaction/entities/transaction.entity';
import * as dayjs from 'dayjs';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';
import { OrderResponse } from '../seven-eleven-proxies/interfaces/711proxy-api.interface';

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
    private proxySellerService: ProxySellerService,
    private cryptomusService: CryptomusService,
    private transactionManagerService: TransactionManagerService,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: User) {
    if (!user.cryptomus_wallet) {
      throw new BadRequestException('You do not have a cryptomus wallet');
    }

    // Validate order items have valid pricing configuration
    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findOne({ where: { id: item.product_id } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.product_id} not found`);
      }

      // Validate pricing configuration
      if (!this.isValidPricingConfiguration(product)) {
        throw new BadRequestException(`Product ${product.name} has invalid pricing configuration. Must have either price_per_ip or price_flow with flow value.`);
      }
    }

    // Validate all products exist
    const productIds = createOrderDto.items.map(item => item.product_id);
    const products = await this.productRepository.find({ where: { id: In(productIds) } });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
    }

    // Check wallet balance before proceeding
    let subtotal = 0;
    let total_items_ip = 0;
    let total_items_flow = 0;

    for (const itemDto of createOrderDto.items) {
      const product = products.find(p => p.id === itemDto.product_id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${itemDto.product_id} not found`);
      }

      let totalPrice: number;

      // Handle different pricing models
      if (product.price_per_ip && product.price_per_ip > 0) {
        // Price per IP model
        const unitPrice = Number(product.price_per_ip);
        totalPrice = Number((unitPrice * Number(itemDto.quantity)).toFixed(2));
        total_items_ip += itemDto.quantity; // Count individual IPs
      } else if (product.price_flow && product.price_flow > 0 && product.flow) {
        // Price per flow model
        const unitPriceFlow = Number(product.price_flow);
        totalPrice = Number((unitPriceFlow * Number(itemDto.quantity)).toFixed(2));
        total_items_flow += Number(product.flow) * itemDto.quantity; // Count total IPs based on flow
      } else {
        throw new BadRequestException(`Product ${product.name} has invalid pricing configuration`);
      }

      subtotal += totalPrice;
    }

    // Check wallet balance
    if (Number(user.cryptomus_wallet.balance) < subtotal) {
      throw new BadRequestException('Insufficient balance in your wallet');
    }

    // Execute all database operations within a single transaction
    const savedOrder = await this.transactionManagerService.executeInTransaction(async (queryRunner) => {
      // Create order
      const order = this.orderRepository.create({
        user: user,
        notes: createOrderDto.notes,
        metadata: createOrderDto.metadata,
        subtotal: subtotal,
        total_amount: subtotal,
        final_amount: subtotal,
        total_items_flow: total_items_flow,
        total_items_ip: total_items_ip,
        status: OrderStatus.COMPLETED,
        payment_status: PaymentStatus.PAID,
      });

      // Save order first to get the ID
      const savedOrder = await queryRunner.manager.save(order);

      // Create order items
      const orderItems: OrderItem[] = [];

      for (const itemDto of createOrderDto.items) {
        const product = products.find(p => p.id === itemDto.product_id);
        if (!product) {
          throw new NotFoundException(`Product with ID ${itemDto.product_id} not found`);
        }

        let totalPrice: number;
        let unitPrice: number | null = null;
        let unitPriceFlow: number | null = null;

        // Handle different pricing models
        if (product.price_per_ip && product.price_per_ip > 0) {
          // Price per IP model
          unitPrice = Number(product.price_per_ip);
          totalPrice = Number((unitPrice * Number(itemDto.quantity)).toFixed(2));
        } else if (product.price_flow && product.price_flow > 0 && product.flow) {
          // Price per flow model
          unitPriceFlow = Number(product.price_flow);
          totalPrice = Number((unitPriceFlow * Number(itemDto.quantity)).toFixed(2));
        } else {
          throw new BadRequestException(`Product ${product.name} has invalid pricing configuration`);
        }

        const orderItem = this.orderItemRepository.create({
          order: savedOrder,
          product: product,
          quantity: itemDto.quantity,
          ...(unitPrice && { unit_price_ip: unitPrice }),
          ...(unitPriceFlow && { unit_price_flow: unitPriceFlow }),
          total_price: totalPrice,
          metadata: {
            ...itemDto.metadata,
            pricing_model: product.price_per_ip ? 'per_ip' : 'per_flow',
            flow_per_unit: product.flow || 1,
            total_ips: product.price_per_ip ? itemDto.quantity : (Number(product.flow) * itemDto.quantity),
            countryId: itemDto.countryId,
            periodId: itemDto.periodId,
            customTargetName: itemDto.customTargetName,
            coupon: itemDto.coupon,
          },
        });

        orderItems.push(orderItem);
      }

      // Save order items
      await queryRunner.manager.save(orderItems);

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
        wallet: user.cryptomus_wallet,
        metadata: {
          wallet_id: user.cryptomus_wallet.id,
          payment_provider: 'cryptomus',
        },
      });

      // Save transaction
      await queryRunner.manager.save(transaction);

      // Update user wallet balance
      user.cryptomus_wallet.balance = user.cryptomus_wallet.balance - savedOrder.final_amount;
      await queryRunner.manager.save(user.cryptomus_wallet);

      return savedOrder;
    });

    // Handle external provider orders after successful transaction
    const orderItems = await this.orderItemRepository.find({
      where: { order: { id: savedOrder.id } },
      relations: { product: true },
    });

    // Create separate proxy orders for each order item
    for (const orderItem of orderItems) {
      const product = orderItem.product;
      const provider = product.provider;
      const itemMetadata = orderItem.metadata;

      if (provider === ProxiesProvider.SEVEN_ELEVEN_PROXIES) {
        // For Seven Eleven Proxies, create separate proxies for each quantity
        const proxies: OrderResponse[] = [];

        // Determine how many individual proxies to create
        let proxyCount: number;
        if (product.price_per_ip && product.price_per_ip > 0) {
          // Per IP pricing - quantity represents number of IPs
          proxyCount = orderItem.quantity;
        } else if (product.price_flow && product.price_flow > 0 && product.flow) {
          // Per flow pricing - quantity represents flow units, convert to total IPs
          proxyCount = orderItem.quantity;
        } else {
          // Fallback to item quantity if no pricing model is clear
          proxyCount = orderItem.quantity;
        }

        // Create individual proxy for each count
        for (let i = 0; i < proxyCount; i++) {
          const orderData = {
            expire: createOrderDto.expire_at ? dayjs(createOrderDto.expire_at).unix().toString() : dayjs().add(90, 'day').unix().toString(), // expire in 90 days
            flow: product.flow ? product.flow.toString() : "0", // Each proxy represents 1 unit
            host: ""
          };
          const proxy_order = await this.sevenElevenProxiesService.createOrder(orderData);
          proxies.push(proxy_order);
        }

        // Update order item metadata with all proxy information
        orderItem.metadata = {
          ...orderItem.metadata,
          proxies: proxies,
          proxy_count: proxyCount,
          pricing_model: product.price_per_ip ? 'per_ip' : 'per_flow',
        };
        await orderItem.save();

      } else if (provider === ProxiesProvider.PROXY_SELLER_PROXIES) {
        // For Proxy Seller Proxies, handle both pricing models
        if (product.price_per_ip && product.price_per_ip > 0) {
          // Per IP pricing - create order for specific number of IPs
          const orderData = {
            countryId: itemMetadata?.countryId || 1, // Use item metadata or default to US
            periodId: itemMetadata?.periodId || '30', // Use item metadata or default to 30 days
            quantity: orderItem.quantity, // Use item quantity
            paymentId: 'balance', // Use balance payment
            authorization: '', // Empty for login/password auth
            customTargetName: itemMetadata?.customTargetName,
            coupon: itemMetadata?.coupon,
          };

          // Calculate order first
          const calculation = await this.proxySellerService.calculateOrder(orderData);

          // Make the order if calculation is successful
          if (calculation.status === 'success') {
            const proxyOrder = await this.proxySellerService.makeOrder(orderData);

            // Update order item metadata with proxy information
            orderItem.metadata = {
              ...orderItem.metadata,
              proxy_order: proxyOrder,
              calculation: calculation,
            };
            await orderItem.save();
          }
        } else if (product.price_flow && product.price_flow > 0 && product.flow) {
          // Per flow pricing - create order for flow units
          const orderData = {
            countryId: itemMetadata?.countryId || 1, // Use item metadata or default to US
            periodId: itemMetadata?.periodId || '30', // Use item metadata or default to 30 days
            quantity: Number(product.flow) * orderItem.quantity, // quantity represents total IPs based on flow
            paymentId: 'balance', // Use balance payment
            authorization: '', // Empty for login/password auth
            customTargetName: itemMetadata?.customTargetName,
            coupon: itemMetadata?.coupon,
          };

          // Calculate order first
          const calculation = await this.proxySellerService.calculateOrder(orderData);

          // Make the order if calculation is successful
          if (calculation.status === 'success') {
            const proxyOrder = await this.proxySellerService.makeOrder(orderData);

            // Update order item metadata with proxy information
            orderItem.metadata = {
              ...orderItem.metadata,
              proxy_order: proxyOrder,
              calculation: calculation,
            };
            await orderItem.save();
          }
        }
      }
    }

    // Save updated order metadata
    await savedOrder.save();

    return await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: {
        items: {
          product: true,
        },
      },
    });
  }

  /**
   * Validate if a product has a valid pricing configuration
   * @param product Product entity
   * @returns boolean
   */
  private isValidPricingConfiguration(product: Product): boolean {
    // Must have either price_per_ip or (price_flow with flow)
    if (product.price_per_ip && product.price_per_ip > 0) {
      return true;
    }

    if (product.price_flow && product.price_flow > 0 && product.flow && product.flow > 0) {
      return true;
    }

    return false;
  }

  async findAll(query: GetAllOrder, user: User): Promise<Pagination<Order>> {
    const { page, per_page, search, user_id } = query;
    const queryBuilder = this.orderRepository.createQueryBuilder('order');
    queryBuilder.leftJoinAndSelect('order.user', 'user');
    queryBuilder.leftJoinAndSelect('order.items', 'items');
    queryBuilder.leftJoinAndSelect('items.product', 'product');

    if (user_id) {
      queryBuilder.where('order.user_id = :user_id', { user_id });
    }

    if (search) {
      queryBuilder.where('order.id = :search', { search });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');
    queryBuilder.distinctOn(['order.created_at']);

    const PaginateOption: IPaginationOptions = {
      page: page || 1,
      limit: per_page || 10,
    }
    return await paginate(queryBuilder, PaginateOption);
  }

  async findOne(paramIdDto: ParamIdDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: paramIdDto.id },
      relations: {
        user: {
          cryptomus_wallet: true,
        },
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${paramIdDto.id} not found`);
    }
    const provider = order.items[0].product.provider;
    if (provider === ProxiesProvider.SEVEN_ELEVEN_PROXIES) {
      // Update each order item's proxy metadata with current status
      for (const item of order.items) {
        if (item.metadata && item.metadata.proxies && Array.isArray(item.metadata.proxies)) {
          // Update each proxy in the proxies array
          for (const proxy of item.metadata.proxies) {
            if (proxy.order_no) {
              try {
                const orderData = await this.sevenElevenProxiesService.getOrderStatus(proxy.order_no);
                // Update the proxy metadata with the latest order status
                proxy.status = orderData.results?.status || proxy.status;
                proxy.flow = orderData.results?.flow || proxy.flow;
                proxy.used = orderData.results?.used || proxy.used;
                proxy.remaining = orderData.results?.remaining || proxy.remaining;
                proxy.createdAt = orderData.results?.createdAt || proxy.createdAt;
                proxy.expiresAt = orderData.results?.expiresAt || proxy.expiresAt;
                proxy.lastUpdated = new Date().toISOString();
              } catch (error) {
                console.error(`Failed to update proxy status for order_no: ${proxy.order_no}`, error);
                // Continue with other proxies even if one fails
              }
            }
          }

          // Save the updated order item metadata
          await item.save();
        }
      }
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

  async update(paramIdDto: ParamIdDto, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(paramIdDto);

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

  async remove(paramIdDto: ParamIdDto): Promise<void> {
    const order = await this.findOne(paramIdDto);
    await this.orderRepository.softDelete(paramIdDto.id);
  }

  async updatePaymentStatus(paramIdDto: ParamIdDto, paymentStatus: PaymentStatus, transactionId?: string): Promise<Order> {
    const order = await this.findOne(paramIdDto);

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
          wallet: order.user.cryptomus_wallet,
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

  async cancelOrder(paramIdDto: ParamIdDto, reason: string): Promise<Order> {
    const order = await this.findOne(paramIdDto);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed order');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelled_reason = reason;
    order.cancelled_at = new Date();

    // Create refund transaction if order was paid
    if (order.payment_status === PaymentStatus.PAID) {
      await this.transactionManagerService.executeInTransaction(async (queryRunner) => {
        // Create refund transaction
        const refundTransaction = this.transactionRepository.create({
          amount: order.final_amount,
          currency: 'USD',
          transaction_type: TransactionType.REFUND,
          status: TransactionStatus.COMPLETED,
          payment_method: PaymentMethod.CRYPTO,
          description: `Order cancellation refund for order #${order.id}`,
          user: order.user,
          order: order,
          wallet: order.user.cryptomus_wallet,
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

        await queryRunner.manager.save(refundTransaction);

        // Refund the user's wallet
        order.user.cryptomus_wallet.balance += order.final_amount;
        await queryRunner.manager.save(order.user.cryptomus_wallet);
      });
    }

    return await this.orderRepository.save(order);
  }

  async createRefundTransaction(paramIdDto: ParamIdDto, refundAmount: number, reason: string): Promise<Transaction> {
    const order = await this.findOne(paramIdDto);

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
      wallet: order.user.cryptomus_wallet,
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

  async getOrderTransactions(paramIdDto: ParamIdDto): Promise<Transaction[]> {
    return await this.transactionRepository.find({
      where: { order: { id: paramIdDto.id } },
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
