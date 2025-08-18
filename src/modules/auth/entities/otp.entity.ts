import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';

import { randomBytes } from 'crypto';

export enum OtpPurpose {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

@Entity('otp')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column({
    type: 'enum',
    enum: OtpPurpose,
    default: OtpPurpose.FORGOT_PASSWORD,
  })
  purpose: OtpPurpose;

  @Column()
  expires_at: Date;

  @Column({ default: false })
  is_used: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @BeforeInsert()
  generateOtpCode() {
    if (process.env.NODE_ENV === 'production') {
      // this.code = randomBytes(3).toString('hex').slice(0, 6);
      this.code = '000000';
    } else {
      this.code = '000000';
    }
  }
}
