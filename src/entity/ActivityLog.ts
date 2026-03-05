import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { Staff } from './Staff'

@Entity({ name: 'ACTIVITY_LOG' })
@Index('IDX_ACTIVITY_LOG_USER_CREATED_AT', ['STAFF_ID', 'CREATED_AT'])
export class ActivityLog {
  @PrimaryGeneratedColumn()
  ID: number

  @Column({ type: 'integer' })
  STAFF_ID: number

  @ManyToOne(() => Staff, { nullable: false })
  @JoinColumn({ name: 'STAFF_ID' })
  STAFF: Staff

  @Column({ type: 'varchar', length: 100 })
  ACTION: string

  @Column({ type: 'varchar', length: 150 })
  MODEL: string

  @Column({ type: 'integer', nullable: true })
  OBJECT_ID: number

  @Column({ type: 'jsonb', nullable: true })
  CHANGES: Record<string, any>

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP', type: 'timestamp' })
  CREATED_AT: Date

  @Column({ name: 'IP', type: 'inet', nullable: true })
  IP?: string

  @Column({ name: 'USER_AGENT', type: 'text', nullable: true })
  USER_AGENT?: string
}
