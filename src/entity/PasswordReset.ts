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
  @PrimaryGeneratedColumn()
  ID: number

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'STAFF_ID' })
  STAFF: Staff

  @Column()
  TOKEN: string

  @Column({ type: 'timestamp' })
  EXPIRES_AT: Date

  @CreateDateColumn()
  CREATED_AT: Date
}

export default PasswordResetToken
