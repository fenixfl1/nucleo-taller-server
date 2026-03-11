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
import { InternalPurchaseOrder } from './InternalPurchaseOrder'

@Entity({ name: 'INTERNAL_PURCHASE_ORDER_LINE' })
@Index('IDX_INTERNAL_PURCHASE_ORDER_LINE_ORDER', ['INTERNAL_PURCHASE_ORDER_ID'])
export class InternalPurchaseOrderLine extends BaseEntity {
  @PrimaryGeneratedColumn()
  INTERNAL_PURCHASE_ORDER_LINE_ID: number

  @Column({ type: 'integer', nullable: false })
  INTERNAL_PURCHASE_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  ARTICLE_ID: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 1 })
  QUANTITY: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  UNIT_COST_REFERENCE: number | null

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => InternalPurchaseOrder, (order) => order.LINES, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'INTERNAL_PURCHASE_ORDER_ID' })
  ORDER: InternalPurchaseOrder

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: 'ARTICLE_ID' })
  ARTICLE: Article
}
