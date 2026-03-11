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
import { InternalPurchaseOrderLine } from './InternalPurchaseOrderLine'
import { InventoryMovement } from './InventoryMovement'

@Entity({ name: 'INTERNAL_PURCHASE_ORDER' })
@Index('UQ_INTERNAL_PURCHASE_ORDER_BUSINESS_NO', ['BUSINESS_ID', 'ORDER_NO'], {
  unique: true,
})
@Index('IDX_INTERNAL_PURCHASE_ORDER_DATE', ['ORDER_DATE'])
@Index('IDX_INTERNAL_PURCHASE_ORDER_STATUS', ['STATUS'])
@Index('IDX_INTERNAL_PURCHASE_ORDER_RECEIVED_MOVEMENT', ['RECEIVED_MOVEMENT_ID'])
export class InternalPurchaseOrder extends BaseEntity {
  @PrimaryGeneratedColumn()
  INTERNAL_PURCHASE_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  ORDER_NO: string | null

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  ORDER_DATE: Date

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'GENERADA' })
  STATUS: string

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'REPLENISHMENT' })
  SOURCE: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @Column({ type: 'timestamp', nullable: true })
  SENT_AT: Date | null

  @Column({ type: 'timestamp', nullable: true })
  RECEIVED_AT: Date | null

  @Column({ type: 'timestamp', nullable: true })
  CANCELLED_AT: Date | null

  @Column({ type: 'integer', nullable: true })
  RECEIVED_MOVEMENT_ID: number | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @ManyToOne(() => InventoryMovement, { nullable: true })
  @JoinColumn({ name: 'RECEIVED_MOVEMENT_ID' })
  RECEIVED_MOVEMENT: InventoryMovement | null

  @OneToMany(() => InternalPurchaseOrderLine, (line) => line.ORDER)
  LINES: InternalPurchaseOrderLine[]
}
