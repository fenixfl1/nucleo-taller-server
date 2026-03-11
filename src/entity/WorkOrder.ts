import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { Person } from './Person'
import { Vehicle } from './Vehicle'
import { Staff } from './Staff'
import { WorkOrderStatus } from './WorkOrderStatus'
import { WorkOrderServiceLine } from './WorkOrderServiceLine'
import { WorkOrderConsumedItem } from './WorkOrderConsumedItem'
import { WorkOrderTechnician } from './WorkOrderTechnician'
import { WorkOrderStatusHistory } from './WorkOrderStatusHistory'
import { DeliveryReceipt } from './DeliveryReceipt'

@Entity({ name: 'WORK_ORDER' })
@Index('IDX_WORK_ORDER_STATUS', ['STATUS_ID'])
@Index('IDX_WORK_ORDER_CUSTOMER', ['CUSTOMER_ID'])
@Index('IDX_WORK_ORDER_VEHICLE', ['VEHICLE_ID'])
@Index('UQ_WORK_ORDER_BUSINESS_ORDER_NO', ['BUSINESS_ID', 'ORDER_NO'], {
  unique: true,
})
export class WorkOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  WORK_ORDER_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  ORDER_NO: string | null

  @Column({ type: 'integer', nullable: false })
  CUSTOMER_ID: number

  @Column({ type: 'integer', nullable: false })
  VEHICLE_ID: number

  @Column({ type: 'integer', nullable: false })
  STATUS_ID: number

  @Column({ type: 'integer', nullable: false })
  RECEIVED_BY_STAFF_ID: number

  @Column({ type: 'integer', nullable: true })
  DELIVERED_BY_STAFF_ID: number | null

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  OPENED_AT: Date

  @Column({ type: 'timestamp', nullable: true })
  PROMISED_AT: Date | null

  @Column({ type: 'timestamp', nullable: true })
  CLOSED_AT: Date | null

  @Column({ type: 'timestamp', nullable: true })
  CANCELLED_AT: Date | null

  @Column({ type: 'varchar', length: 1000, nullable: false })
  SYMPTOM: string

  @Column({ type: 'text', nullable: true })
  DIAGNOSIS: string | null

  @Column({ type: 'text', nullable: true })
  WORK_PERFORMED: string | null

  @Column({ type: 'text', nullable: true })
  INTERNAL_NOTES: string | null

  @Column({ type: 'text', nullable: true })
  CUSTOMER_OBSERVATIONS: string | null

  @Column({ type: 'boolean', default: false })
  REQUIRES_DISASSEMBLY: boolean

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @ManyToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'CUSTOMER_ID' })
  CUSTOMER: Person

  @ManyToOne(() => Vehicle, { nullable: false })
  @JoinColumn({ name: 'VEHICLE_ID' })
  VEHICLE: Vehicle

  @ManyToOne(() => WorkOrderStatus, (status) => status.WORK_ORDERS, {
    nullable: false,
  })
  @JoinColumn({ name: 'STATUS_ID' })
  STATUS: WorkOrderStatus

  @ManyToOne(() => Staff, { nullable: false })
  @JoinColumn({ name: 'RECEIVED_BY_STAFF_ID' })
  RECEIVED_BY: Staff

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'DELIVERED_BY_STAFF_ID' })
  DELIVERED_BY: Staff | null

  @OneToMany(() => WorkOrderServiceLine, (line) => line.WORK_ORDER)
  SERVICE_LINES: WorkOrderServiceLine[]

  @OneToMany(() => WorkOrderConsumedItem, (line) => line.WORK_ORDER)
  CONSUMED_ITEMS: WorkOrderConsumedItem[]

  @OneToMany(() => WorkOrderTechnician, (line) => line.WORK_ORDER)
  TECHNICIANS: WorkOrderTechnician[]

  @OneToMany(() => WorkOrderStatusHistory, (history) => history.WORK_ORDER)
  STATUS_HISTORY: WorkOrderStatusHistory[]

  @OneToOne(() => DeliveryReceipt, (receipt) => receipt.WORK_ORDER)
  DELIVERY_RECEIPT: DeliveryReceipt | null
}
