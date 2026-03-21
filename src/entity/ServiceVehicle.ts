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

@Entity({ name: 'SERVICE_VEHICLE' })
@Index('UQ_SERVICE_VEHICLE_BUSINESS_PLATE', ['BUSINESS_ID', 'PLATE'], {
  unique: true,
})
@Index('UQ_SERVICE_VEHICLE_BUSINESS_VIN', ['BUSINESS_ID', 'VIN'], {
  unique: true,
})
export class ServiceVehicle extends BaseEntity {
  @PrimaryGeneratedColumn()
  SERVICE_VEHICLE_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'varchar', length: 100, nullable: false })
  NAME: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  PLATE: string | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  VIN: string | null

  @Column({ type: 'varchar', length: 60, nullable: false })
  BRAND: string

  @Column({ type: 'varchar', length: 60, nullable: false })
  MODEL: string

  @Column({ type: 'integer', nullable: true })
  YEAR: number | null

  @Column({ type: 'varchar', length: 30, nullable: true })
  COLOR: string | null

  @Column({ type: 'varchar', length: 60, nullable: true })
  ENGINE: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business
}
