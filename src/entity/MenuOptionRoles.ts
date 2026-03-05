import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm'
import { MenuOption } from './MenuOption'
import { Role } from './Role'
import { BaseEntity } from './BaseEntity'

@Entity('MENU_OPTIONS_X_ROLES')
export class MenuOptionRole extends BaseEntity {
  @PrimaryColumn({ name: 'MENU_OPTION_ID', type: 'varchar', length: 50 })
  MENU_OPTION_ID!: string

  @PrimaryColumn({ name: 'ROLE_ID', type: 'integer' })
  ROLE_ID!: number

  @ManyToOne(() => MenuOption, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MENU_OPTION_ID' })
  MENU_OPTION!: MenuOption

  @ManyToOne(() => Role, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ROLE_ID' })
  ROLE!: Role
}
