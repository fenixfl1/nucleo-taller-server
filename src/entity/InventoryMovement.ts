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
import { InventoryMovementDetail } from './InventoryMovementDetail'

@Entity({ name: 'INVENTORY_MOVEMENT' })
@Index('IDX_INVENTORY_MOVEMENT_TYPE', ['MOVEMENT_TYPE'])
@Index('IDX_INVENTORY_MOVEMENT_DATE', ['MOVEMENT_DATE'])
@Index('UQ_INVENTORY_MOVEMENT_BUSINESS_NO', ['BUSINESS_ID', 'MOVEMENT_NO'], {
  unique: true,
})
export class InventoryMovement extends BaseEntity {
  @PrimaryGeneratedColumn()
  MOVEMENT_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  MOVEMENT_NO: string | null

  @Column({ type: 'varchar', length: 30, nullable: false })
  MOVEMENT_TYPE: string

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  MOVEMENT_DATE: Date

  @Column({ type: 'varchar', length: 30, nullable: false, default: 'MANUAL' })
  REFERENCE_SOURCE: string

  @Column({ type: 'integer', nullable: true })
  REFERENCE_ID: number | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @OneToMany(() => InventoryMovementDetail, (detail) => detail.MOVEMENT)
  DETAILS: InventoryMovementDetail[]
}
