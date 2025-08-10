import { User } from "src/modules/users/entities/user.entity";
import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    BaseEntity,
} from "typeorm";

export enum ThirdPartyApiType {
    EMAIL = "email",
    SMS = "sms",
    WHATSAPP = "whatsapp",
    TELEGRAM = "telegram",
    FACEBOOK = "facebook",
    INSTAGRAM = "instagram",
    TWITTER = "twitter",
}

export enum UseFor {
    FOR_CUSTOMER = "for_customer",
    FOR_ADMIN = "for_admin",
    // Add more as needed
}

@Entity("third_party_api")
export class ThirdPartyApi extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column()
    key: string;

    @Column({ type: "enum", enum: ThirdPartyApiType, nullable: true, default: null })
    type: ThirdPartyApiType;

    @Column({ type: "boolean", default: true })
    is_active: boolean;

    @Column({ type: "integer", default: 0 })
    hourly_limit: number;

    @Column({ type: "integer", default: 0 })
    daily_limit: number;

    @Column({ type: "integer", default: 0 })
    system_reserved_limit: number;

    @Column({ default: false })
    is_default: boolean;

    @Column({
        type: "enum",
        enum: UseFor,
        nullable: true,
        default: null,
    })
    use_for: UseFor;

    @ManyToOne(() => User, (user) => user.third_party_api)
    @JoinColumn({ name: "created_by" })
    created_by: User;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true, default: null })
    deleted_at: Date;
}
