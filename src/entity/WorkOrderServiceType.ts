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

@Entity({ name: 'WORK_ORDER_SERVICE_TYPE' })
@Index('UQ_WORK_ORDER_SERVICE_TYPE_BUSINESS_CODE', ['BUSINESS_ID', 'CODE'], {
  unique: true,
})
@Index('IDX_WORK_ORDER_SERVICE_TYPE_ORDER', ['ORDER_INDEX'])
export class WorkOrderServiceType extends BaseEntity {
  @PrimaryGeneratedColumn()
  SERVICE_TYPE_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 30, nullable: false })
  CODE: string

  @Column({ type: 'varchar', length: 100, nullable: false })
  NAME: string

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESCRIPTION: string | null

  @Column({ type: 'integer', nullable: false, default: 0 })
  ORDER_INDEX: number

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business
}
