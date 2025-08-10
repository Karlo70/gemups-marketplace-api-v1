import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';


export enum ModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ModelType {
  LLM = 'llm',
  TRANSCRIBER = 'transcriber',
}

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ModelType, default: ModelType.LLM })
  type: ModelType;

  @Column({ type: 'varchar', length: 255 })
  provider: string;

  @Column({ type: 'enum', enum: ModelStatus, default: ModelStatus.ACTIVE })
  status: ModelStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deletedAt: Date;
}
