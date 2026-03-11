import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import { Staff } from './Staff'
import { MenuOption } from './MenuOption'

@Entity({ name: 'ROLES' })
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  ROLE_ID: number

  @Column({ type: 'varchar', unique: true, length: 30, nullable: false })
  NAME: string

  @Column({ type: 'text' })
  DESCRIPTION: string

  @OneToMany(() => Staff, (staff) => staff.ROLE)
  STAFF: Staff[]

  @ManyToMany(() => MenuOption, (menuOption) => menuOption.ROLES)
  MENU_OPTIONS: MenuOption[]
}
