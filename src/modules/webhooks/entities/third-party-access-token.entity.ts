import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Platform {
  FACEBOOK = 'facebook',
}
@Entity('third_party_access_token')
export class ThirdPartyAccessToken extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: Platform })
  platform: Platform;

  @Column()
  short_lived_access_token: string;

  @Column()
  long_lived_access_token: string;

  @Column()
  expires_at: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deleted_at: Date;
}
