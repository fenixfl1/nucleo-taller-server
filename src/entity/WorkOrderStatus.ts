import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { WorkOrder } from './WorkOrder'

@Entity({ name: 'WORK_ORDER_STATUS' })
@Index('UQ_WORK_ORDER_STATUS_CODE', ['CODE'], { unique: true })
@Index('IDX_WORK_ORDER_STATUS_ORDER', ['ORDER_INDEX'])
export class WorkOrderStatus extends BaseEntity {
  @PrimaryGeneratedColumn()
  STATUS_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number | null

  @Column({ type: 'varchar', length: 30, nullable: false })
  CODE: string

  @Column({ type: 'varchar', length: 100, nullable: false })
  NAME: string

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESCRIPTION: string | null

  @Column({ type: 'boolean', default: false })
  IS_FINAL: boolean

  @Column({ type: 'integer', nullable: false, default: 0 })
  ORDER_INDEX: number

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business | null

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.STATUS)
  WORK_ORDERS: WorkOrder[]
}
