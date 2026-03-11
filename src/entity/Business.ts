import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Staff } from './Staff'
import { BaseEntity } from './BaseEntity'

@Entity({ name: 'BUSINESS ' })
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  BUSINESS_ID: number

  @Column({ type: 'varchar', nullable: true })
  NAME: string

  @Column({ type: 'varchar', nullable: true })
  RNC: string

  @Column({ type: 'varchar', nullable: true })
  DESCRIPTION: string

  @Column({ type: 'text', nullable: true })
  ADDRESS: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  PHONE: string

  @Column({ type: 'text', nullable: true })
  LOGO: string

  @OneToMany(() => Staff, (staff) => staff.BUSINESS)
  STAFF: Staff[]
}

export default Business
