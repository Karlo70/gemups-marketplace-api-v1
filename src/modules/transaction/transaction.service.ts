import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { GetAllTransactionDto } from './dto/get-all-transaction.dto';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { IPaginationOptions, Pagination } from 'nestjs-typeorm-paginate';
import { paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) { }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create(createTransactionDto);
    return await this.transactionRepository.save(transaction);
  }

  async findAll(query: GetAllTransactionDto): Promise<Pagination<Transaction>> {
    const {
      page = 1,
      per_page = 10,
      search,
      user_id,
      order_id,
      payment_method,
      transaction_type,
      status,
      min_amount,
      max_amount,
      from,
      to,
    } = query;

    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.order', 'order')
      .leftJoinAndSelect('transaction.proxy', 'proxy')
      .orderBy('transaction.created_at', 'DESC');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(transaction.description LIKE :search OR transaction.payment_transaction_id LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (user_id) {
      queryBuilder.andWhere('transaction.user_id = :user_id', { user_id });
    }

    if (order_id) {
      queryBuilder.andWhere('transaction.order_id = :order_id', { order_id });
    }

    if (payment_method) {
      queryBuilder.andWhere('transaction.payment_method = :payment_method', { payment_method });
    }

    if (transaction_type) {
      queryBuilder.andWhere('transaction.transaction_type = :transaction_type', { transaction_type });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (min_amount) {
      queryBuilder.andWhere('transaction.amount >= :min_amount', { min_amount });
    }

    if (max_amount) {
      queryBuilder.andWhere('transaction.amount <= :max_amount', { max_amount });
    }

    if (from && to) {
      queryBuilder.andWhere('transaction.created_at BETWEEN :from AND :to', { from, to });
    }

    const PaginateOption: IPaginationOptions = {
      page,
      limit: per_page,
    }

    return await paginate(queryBuilder, PaginateOption);

  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user', 'order', 'proxy'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);

    // Prepare update data with proper types
    const updateData: any = { ...updateTransactionDto };

    if (updateTransactionDto.status === TransactionStatus.REFUNDED && !transaction.refunded_at) {
      updateData.refunded_at = new Date();
    }


    if (updateTransactionDto.refunded_at && typeof updateTransactionDto.refunded_at === 'string') {
      updateData.refunded_at = new Date(updateTransactionDto.refunded_at);
    }

    Object.assign(transaction, updateData);
    return await this.transactionRepository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionRepository.softDelete(id);
  }

  async getTransactionStats(userId?: string): Promise<{
    total_transactions: number;
    total_amount: number;
    successful_transactions: number;
    failed_transactions: number;
    pending_transactions: number;
  }> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('transaction');

    if (userId) {
      queryBuilder.where('transaction.user_id = :userId', { userId });
    }

    const [
      total_transactions,
      total_amount,
      successful_transactions,
      failed_transactions,
      pending_transactions,
    ] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder
        .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
        .select('SUM(transaction.amount)', 'total')
        .getRawOne()
        .then(result => parseFloat(result?.total || '0')),
      queryBuilder
        .andWhere('transaction.status = :status', { status: TransactionStatus.COMPLETED })
        .getCount(),
      queryBuilder
        .andWhere('transaction.status = :status', { status: TransactionStatus.FAILED })
        .getCount(),
      queryBuilder
        .andWhere('transaction.status = :status', { status: TransactionStatus.PENDING })
        .getCount(),
    ]);

    return {
      total_transactions,
      total_amount,
      successful_transactions,
      failed_transactions,
      pending_transactions,
    };
  }
}
