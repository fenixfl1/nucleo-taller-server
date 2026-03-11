import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { Article } from './Article'
import { InventoryMovement } from './InventoryMovement'

@Entity({ name: 'INVENTORY_MOVEMENT_DETAIL' })
@Index('IDX_INVENTORY_MOVEMENT_DETAIL_MOVEMENT', ['MOVEMENT_ID'])
export class InventoryMovementDetail extends BaseEntity {
  @PrimaryGeneratedColumn()
  MOVEMENT_DETAIL_ID: number

  @Column({ type: 'integer', nullable: false })
  MOVEMENT_ID: number

  @Column({ type: 'integer', nullable: false })
  ARTICLE_ID: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 1 })
  QUANTITY: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  UNIT_COST_REFERENCE: number | null

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => InventoryMovement, (movement) => movement.DETAILS, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'MOVEMENT_ID' })
  MOVEMENT: InventoryMovement

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: 'ARTICLE_ID' })
  ARTICLE: Article
}
