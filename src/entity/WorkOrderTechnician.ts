import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { WorkOrder } from './WorkOrder'
import { Staff } from './Staff'

@Entity({ name: 'WORK_ORDER_TECHNICIAN' })
@Index('UQ_WORK_ORDER_TECHNICIAN_STAFF', ['WORK_ORDER_ID', 'STAFF_ID'], {
  unique: true,
})
export class WorkOrderTechnician extends BaseEntity {
  @PrimaryGeneratedColumn()
  WORK_ORDER_TECHNICIAN_ID: number

  @Column({ type: 'integer', nullable: false })
  WORK_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  STAFF_ID: number

  @Column({ type: 'varchar', length: 30, nullable: true })
  ROLE_ON_JOB: string | null

  @Column({ type: 'boolean', default: false })
  IS_LEAD: boolean

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  REFERENCE_PERCENT: number | null

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  REFERENCE_AMOUNT: number | null

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.TECHNICIANS, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'WORK_ORDER_ID' })
  WORK_ORDER: WorkOrder

  @ManyToOne(() => Staff, { nullable: false })
  @JoinColumn({ name: 'STAFF_ID' })
  STAFF: Staff
}
