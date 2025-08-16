import { BaseEntity, Column, CreateDateColumn, Entity, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { CartItem } from "./cart-item.entity";

@Entity('cart')
export class Cart extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    @Column({ type: 'int', default: 0 })
    total_items: number;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Relationships
    @ManyToOne(() => User, user => user.cart)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => CartItem, cartItem => cartItem.cart, { cascade: true })
    items: CartItem[];
}
