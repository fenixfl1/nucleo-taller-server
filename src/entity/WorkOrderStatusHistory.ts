import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { WorkOrder } from './WorkOrder'
import { WorkOrderStatus } from './WorkOrderStatus'
import { Staff } from './Staff'

@Entity({ name: 'WORK_ORDER_STATUS_HISTORY' })
@Index('IDX_WORK_ORDER_STATUS_HISTORY_ORDER', ['WORK_ORDER_ID'])
export class WorkOrderStatusHistory {
  @PrimaryGeneratedColumn()
  HISTORY_ID: number

  @Column({ type: 'integer', nullable: false })
  WORK_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  STATUS_ID: number

  @Column({ type: 'integer', nullable: false })
  CHANGED_BY_STAFF_ID: number

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  CHANGED_AT: Date

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.STATUS_HISTORY, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'WORK_ORDER_ID' })
  WORK_ORDER: WorkOrder

  @ManyToOne(() => WorkOrderStatus, { nullable: false })
  @JoinColumn({ name: 'STATUS_ID' })
  STATUS: WorkOrderStatus

  @ManyToOne(() => Staff, { nullable: false })
  @JoinColumn({ name: 'CHANGED_BY_STAFF_ID' })
  CHANGED_BY: Staff
}
