import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { Role } from './Role'
import { Person } from './Person'

@Entity({ name: 'STAFF' })
export class Staff extends BaseEntity {
  @PrimaryGeneratedColumn()
  STAFF_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'integer', nullable: true })
  ROLE_ID: number

  @Column({ type: 'integer', nullable: true })
  PERSON_ID: number

  @Column({ type: 'text', nullable: true })
  AVATAR: string

  @Column({ unique: true, type: 'varchar' })
  USERNAME: string

  @Column({ type: 'varchar', nullable: false })
  PASSWORD: string

  @Column({ type: 'integer', nullable: true })
  LOGIN_COUNT: number

  @Column({ type: 'timestamp', nullable: true })
  LAST_LOGIN: Date

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'ROLE_ID' })
  ROLE: Role

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @OneToOne(() => Person, { nullable: false })
  @JoinColumn({ name: 'PERSON_ID' })
  PERSON: Person
}
