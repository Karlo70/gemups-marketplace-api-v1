import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Cart } from "./cart.entity";
import { Product } from "../../products/entities/product.entity";

@Entity('cart_item')
export class CartItem extends BaseEntity {
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
    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @ManyToOne(() => Product, product => product.cart_items)
    @JoinColumn({ name: 'product_id' })
    product: Product;
}
