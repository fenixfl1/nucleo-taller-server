import {
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  BaseEntity as Base,
  JoinColumn,
  Entity,
} from 'typeorm'

export abstract class BaseEntity extends Base {
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  CREATED_AT: Date | null

  @Column({ type: 'integer', nullable: true })
  CREATED_BY: number

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: true,
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  UPDATED_AT: Date | null

  @Column({ type: 'integer', nullable: true })
  UPDATED_BY?: number

  @Column({ type: 'char', length: 1, default: 'A' })
  STATE: string | null
}
