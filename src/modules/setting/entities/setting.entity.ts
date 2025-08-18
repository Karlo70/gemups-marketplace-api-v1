import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ProxyType {
    RESIDENTIAL = "residential",
    DATACENTER = "datacenter",
    MOBILE = "mobile",
    ROTATING = "rotating",
}

export enum FlowUnit {
    GB = "gb",
    MB = "mb",
    TB = "tb",
}

export enum SettingType {
    PROXY_PRICING = "proxy_pricing",
    SYSTEM_CONFIG = "system_config",
    FEATURE_FLAG = "feature_flag",
}

@Entity('setting')
export class Setting extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "enum", enum: SettingType })
    type: SettingType;

    @Column()
    key: string;

    @Column({ type: 'jsonb', nullable: true })
    value: any;

    @Column({ nullable: true })
    description: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    metadata: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    deleted_at: Date;
}

@Entity('proxy_pricing_setting')
export class ProxyPricingSetting extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "enum", enum: ProxyType })
    proxy_type: ProxyType;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    price_per_ip: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    price_per_flow: number;

    @Column({ type: "enum", enum: FlowUnit, default: FlowUnit.GB })
    flow_unit: FlowUnit;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
    flow_multiplier: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    setup_fee: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
    maintenance_fee: number;

    @Column({ type: 'int', default: 1 })
    minimum_quantity: number;

    @Column({ type: 'int', nullable: true })
    maximum_quantity: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    discount_percentage: number;

    @Column({ type: 'int', default: 0 })
    discount_threshold: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: 'jsonb', nullable: true })
    custom_pricing_rules: any;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({ nullable: true })
    deleted_at: Date;
}
