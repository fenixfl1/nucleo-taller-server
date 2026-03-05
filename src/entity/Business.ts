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
class Business extends BaseEntity {
  @PrimaryGeneratedColumn()
  BUSINESS_ID: number

  @Column({ type: 'text' })
  NAME: string

  @Column({ type: 'text' })
  RNC: string

  @Column({ type: 'text' })
  DESCRIPTION: string

  @Column({ type: 'text' })
  ADDRESS: string

  @Column({ type: 'text' })
  PHONE: string

  @OneToMany(() => Staff, (staff) => staff.BUSINESS)
  STAFF: Staff[]
}

export default Business
