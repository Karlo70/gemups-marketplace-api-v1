import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'in_active',
}

@Entity('category')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'enum', enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  status: CategoryStatus;

  @Column({ nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
