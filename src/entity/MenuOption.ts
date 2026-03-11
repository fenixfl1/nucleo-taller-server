import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm'
import { Role } from './Role'

import { BaseEntity } from './BaseEntity'
import { Staff } from './Staff'

@Entity('MENU_OPTION')
@Index('IDX_MENU_OPTION_PARENT_ORDER', ['PARENT_ID', 'ORDER'])
@Unique('UQ_MENU_OPTION_PARENT_ORDER', ['PARENT_ID', 'ORDER'])
export class MenuOption extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  MENU_OPTION_ID: string

  @Column({ type: 'varchar', length: 100 })
  NAME: string

  @Column({ type: 'varchar', length: 250, nullable: true })
  DESCRIPTION?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  PATH?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  TYPE?: 'link' | 'divider' | 'group' | 'item' | 'submenu'

  @Column({ type: 'text', nullable: true })
  ICON?: string

  @Column({ nullable: false, type: 'integer' })
  ORDER: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  PARENT_ID: string

  @ManyToOne(() => MenuOption, { nullable: true })
  @JoinColumn({ name: 'PARENT_ID' })
  PARENT?: MenuOption

  @OneToMany(() => MenuOption, (option) => option.PARENT)
  CHILDREN: MenuOption[]

  @ManyToMany(() => Role, (role) => role.MENU_OPTIONS)
  @JoinTable({
    name: 'MENU_OPTIONS_X_ROLES',
    joinColumn: {
      name: 'MENU_OPTION_ID',
      referencedColumnName: 'MENU_OPTION_ID',
    },
    inverseJoinColumn: { name: 'ROLE_ID', referencedColumnName: 'ROLE_ID' },
  })
  ROLES: Role[]

  @Column({ type: 'text', nullable: true })
  CONTENT: string

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'CREATED_BY' })
  CREATOR: Staff
}
