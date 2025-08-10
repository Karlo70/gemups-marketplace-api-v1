import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { GetAllInvoiceDto } from './dto/get-all-invoices-schema.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,

    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}
  async findAll(currentUser: User, getAllInvoiceDto: GetAllInvoiceDto) {
    const {
      search,
      page = 1,
      per_page = 10,
      subscription_id,
      user_id,
      role,
      date_from,
      date_to,
      order,
      plan_type
    } = getAllInvoiceDto;

    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan');

    if (
      [UserRole.CUSTOMER].includes(currentUser?.role)
    ) {
      queryBuilder.where('user.id = :user_id', { user_id: currentUser?.id });
    }

    if (
      user_id &&
      [UserRole.ADMIN].includes(currentUser?.role)
    ) {
      queryBuilder.andWhere('user.id = :user_id', { user_id });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.full_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if(plan_type){
      queryBuilder.andWhere('plan.type = :plan_type', { plan_type });
    }

    if (subscription_id) {
      queryBuilder.andWhere('subscription.id = :subscription_id', {
        subscription_id,
      });
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (date_from) {
      queryBuilder.andWhere('invoice.created_at >= :date_from', {
        date_from,
      });
    }

    if (date_to) {
      queryBuilder.andWhere('invoice.created_at <= :date_to', {
        date_to,
      });
    }

    queryBuilder
      .groupBy('invoice.id')
      .addGroupBy('subscription.id')
      .addGroupBy('plan.id')
      .addGroupBy('user.id')
      .distinctOn(['invoice.created_at'])
      .orderBy('invoice.created_at', order ?? 'DESC');

    const paginationOptions: IPaginationOptions = {
      page: page,
      limit: per_page,
    };

    return paginate<Invoice>(queryBuilder, paginationOptions);
  }
}
