import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Order } from "./order.entity";
import { Product } from "../../products/entities/product.entity";

@Entity('order_item')
export class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unit_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relationships
    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, product => product.order_items)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}
