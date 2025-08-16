import { Category } from "src/modules/category/entities/category.entity";
import { OrderItem } from "src/modules/order/entities/order-item.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, UpdateDateColumn, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { CartItem } from "src/modules/cart/entities/cart-item.entity";

export enum providers {
    SEVEN_ELEVEN_PROXIES = "711_proxies",
}

export enum ProductStatus {
    ACTIVE = "active",
    INACTIVE = "in_active",
}

@Entity('product')
export class Product extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ nullable: true })
    image_url: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price_per_ip: number;

    @Column({ type: "enum", enum: providers })
    provider: providers;

    @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.ACTIVE })
    status: ProductStatus;

    @ManyToOne(() => Category, category => category.products )
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    order_items: OrderItem[];        

    @OneToMany(() => CartItem, cartItem => cartItem.product)
    cart_items: CartItem[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    deleted_at: Date;
}
