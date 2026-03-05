import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'

@Entity({ name: 'ARTICLE' })
@Index('IDX_ARTICLE_NAME', ['NAME'])
@Index('UQ_ARTICLE_BUSINESS_CODE', ['BUSINESS_ID', 'CODE'], { unique: true })
export class Article extends BaseEntity {
  @PrimaryGeneratedColumn()
  ARTICLE_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 30, nullable: false })
  CODE: string

  @Column({ type: 'varchar', length: 120, nullable: false })
  NAME: string

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'REPUESTO' })
  ITEM_TYPE: string

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'UND' })
  UNIT_MEASURE: string

  @Column({ type: 'varchar', length: 60, nullable: true })
  CATEGORY: string | null

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 0 })
  MIN_STOCK: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  MAX_STOCK: number | null

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false, default: 0 })
  CURRENT_STOCK: number

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  COST_REFERENCE: number | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  DESCRIPTION: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business
}
