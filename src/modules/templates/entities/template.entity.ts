import { NotificationSequence } from 'src/modules/notification-sequence/entities/notification-sequence.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
}

export enum TemplateStatus {
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active',
}

@Entity('templates')
export class Template extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'enum', enum: TemplateType })
  type: TemplateType;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.ACTIVE,
  })
  status: TemplateStatus;

  @OneToMany(() => NotificationSequence, (sequence) => sequence.template)
  sequence: NotificationSequence[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date;
}
