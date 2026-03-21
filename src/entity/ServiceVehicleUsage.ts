import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { BaseEntity } from './BaseEntity'
import Business from './Business'
import { ServiceVehicle } from './ServiceVehicle'
import { Staff } from './Staff'

export type ServiceVehicleUsageStatus =
  | 'EN_CURSO'
  | 'FINALIZADA'
  | 'CANCELADA'

@Entity({ name: 'SERVICE_VEHICLE_USAGE' })
export class ServiceVehicleUsage extends BaseEntity {
  @PrimaryGeneratedColumn()
  SERVICE_VEHICLE_USAGE_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'integer', nullable: false })
  SERVICE_VEHICLE_ID: number

  @Column({ type: 'integer', nullable: true })
  STAFF_ID: number | null

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'EN_CURSO' })
  STATUS: ServiceVehicleUsageStatus

  @Column({ type: 'varchar', length: 150, nullable: false })
  PURPOSE: string

  @Column({ type: 'varchar', length: 120, nullable: true })
  ORIGIN: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  DESTINATION: string | null

  @Column({ type: 'timestamp', nullable: false })
  STARTED_AT: Date

  @Column({ type: 'timestamp', nullable: true })
  ENDED_AT: Date | null

  @Column({ type: 'integer', nullable: true })
  ODOMETER_START: number | null

  @Column({ type: 'integer', nullable: true })
  ODOMETER_END: number | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @ManyToOne(() => ServiceVehicle, { nullable: false })
  @JoinColumn({ name: 'SERVICE_VEHICLE_ID' })
  SERVICE_VEHICLE: ServiceVehicle

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'STAFF_ID' })
  STAFF: Staff | null
}
