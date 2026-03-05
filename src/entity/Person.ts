import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { Staff } from './Staff'
import { Contact } from './Contact'

@Entity({ name: 'PERSON' })
export class Person extends BaseEntity {
  @PrimaryGeneratedColumn()
  PERSON_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', nullable: false })
  NAME: string

  @Column({ type: 'varchar', nullable: true })
  LAST_NAME: string | null

  @Column({ type: 'varchar', nullable: true, length: '11' })
  IDENTITY_DOCUMENT: string | null

  @Column({ type: 'date', nullable: true })
  BIRTH_DATE: Date | null

  @Column({ type: 'char', length: 1, nullable: true })
  GENDER: string

  @Column({ type: 'varchar', nullable: true })
  ADDRESS: string

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @OneToOne(() => Staff, (staff) => staff.PERSON)
  STAFF: Staff

  @OneToMany(() => Contact, (c) => c.PERSON)
  CONTACTS: Contact[]
}
