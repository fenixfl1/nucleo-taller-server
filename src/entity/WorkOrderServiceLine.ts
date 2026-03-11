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

@Entity({ name: 'WORK_ORDER_SERVICE_LINE' })
@Index('IDX_WORK_ORDER_SERVICE_LINE_WORK_ORDER', ['WORK_ORDER_ID'])
export class WorkOrderServiceLine extends BaseEntity {
  @PrimaryGeneratedColumn()
  SERVICE_LINE_ID: number

  @Column({ type: 'integer', nullable: false })
  WORK_ORDER_ID: number

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'SERVICIO' })
  SERVICE_TYPE: string

  @Column({ type: 'varchar', length: 500, nullable: false })
  DESCRIPTION: string

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 1 })
  QUANTITY: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 0 })
  REFERENCE_AMOUNT: number

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.SERVICE_LINES, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'WORK_ORDER_ID' })
  WORK_ORDER: WorkOrder
}
