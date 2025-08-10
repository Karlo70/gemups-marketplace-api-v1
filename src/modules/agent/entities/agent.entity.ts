import { CreateAssistantDto } from '@vapi-ai/server-sdk/api';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('agents')
export class Agent extends BaseEntity implements CreateAssistantDto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  assistant_id: string;

  @Column({ nullable: true })
  firstMessage: string;
  
  @Column({ nullable: true, default: null })
  phone_number_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true, default: null })
  deleted_at: Date;
}
