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
import { Article } from './Article'

@Entity({ name: 'WORK_ORDER_CONSUMED_ITEM' })
@Index('UQ_WORK_ORDER_CONSUMED_ITEM_ARTICLE', ['WORK_ORDER_ID', 'ARTICLE_ID'], {
  unique: true,
})
export class WorkOrderConsumedItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  CONSUMED_ITEM_ID: number

  @Column({ type: 'integer', nullable: false })
  WORK_ORDER_ID: number

  @Column({ type: 'integer', nullable: false })
  ARTICLE_ID: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 1 })
  QUANTITY: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  UNIT_COST_REFERENCE: number | null

  @Column({ type: 'varchar', length: 250, nullable: true })
  NOTES: string | null

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.CONSUMED_ITEMS, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'WORK_ORDER_ID' })
  WORK_ORDER: WorkOrder

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: 'ARTICLE_ID' })
  ARTICLE: Article
}
