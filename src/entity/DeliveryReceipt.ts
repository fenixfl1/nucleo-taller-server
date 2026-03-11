import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { WorkOrder } from './WorkOrder'
import { Staff } from './Staff'

@Entity({ name: 'DELIVERY_RECEIPT' })
@Index('UQ_DELIVERY_RECEIPT_BUSINESS_NO', ['BUSINESS_ID', 'RECEIPT_NO'], {
  unique: true,
})
@Index('UQ_DELIVERY_RECEIPT_WORK_ORDER', ['WORK_ORDER_ID'], { unique: true })
export class DeliveryReceipt extends BaseEntity {
  @PrimaryGeneratedColumn()
  DELIVERY_RECEIPT_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  RECEIPT_NO: string | null

  @Column({ type: 'integer', nullable: false })
  WORK_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  DELIVERED_BY_STAFF_ID: number

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  DELIVERY_DATE: Date

  @Column({ type: 'varchar', length: 120, nullable: false })
  RECEIVED_BY_NAME: string

  @Column({ type: 'varchar', length: 30, nullable: true })
  RECEIVED_BY_DOCUMENT: string | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  RECEIVED_BY_PHONE: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  OBSERVATIONS: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @OneToOne(() => WorkOrder, (workOrder) => workOrder.DELIVERY_RECEIPT, {
    nullable: false,
  })
  @JoinColumn({ name: 'WORK_ORDER_ID' })
  WORK_ORDER: WorkOrder

  @ManyToOne(() => Staff, { nullable: false })
  @JoinColumn({ name: 'DELIVERED_BY_STAFF_ID' })
  DELIVERED_BY: Staff
}
