import { User } from 'src/modules/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
}

@Entity()
export class Media extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  type: MediaType;

  @Column()
  url: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;
}
