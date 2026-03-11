import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Staff } from './Staff'

@Entity({ name: 'PASSWORD_RESET_TOKENS' })
export class PasswordResetToken {
  @PrimaryGeneratedColumn({ type: 'integer' })
  ID: number

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'STAFF_ID' })
  STAFF: Staff

  @Column({ type: 'text' })
  TOKEN: string

  @Column({ type: 'timestamp' })
  EXPIRES_AT: Date

  @CreateDateColumn({ type: 'timestamp' })
  CREATED_AT: Date
}

export default PasswordResetToken
