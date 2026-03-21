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

export type ServiceVehicleMaintenanceStatus =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO'

export type ServiceVehicleMaintenanceType =
  | 'PREVENTIVO'
  | 'CORRECTIVO'
  | 'INSPECCION'
  | 'CAMBIO_PIEZA'
  | 'OTRO'

export type ServiceVehicleMaintenancePriority = 'BAJA' | 'MEDIA' | 'ALTA'

@Entity({ name: 'SERVICE_VEHICLE_MAINTENANCE' })
export class ServiceVehicleMaintenance extends BaseEntity {
  @PrimaryGeneratedColumn()
  SERVICE_VEHICLE_MAINTENANCE_ID: number

  @Column({ type: 'integer', nullable: true })
  BUSINESS_ID: number

  @Column({ type: 'integer', nullable: false })
  SERVICE_VEHICLE_ID: number

  @Column({ type: 'varchar', length: 30, nullable: false })
  MAINTENANCE_TYPE: ServiceVehicleMaintenanceType

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'MEDIA' })
  PRIORITY: ServiceVehicleMaintenancePriority

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'PENDIENTE' })
  STATUS: ServiceVehicleMaintenanceStatus

  @Column({ type: 'varchar', length: 120, nullable: false })
  TITLE: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  DESCRIPTION: string | null

  @Column({ type: 'timestamp', nullable: true })
  SCHEDULED_AT: Date | null

  @Column({ type: 'timestamp', nullable: true })
  PERFORMED_AT: Date | null

  @Column({ type: 'integer', nullable: true })
  ODOMETER: number | null

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  COST_REFERENCE: number | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  NOTES: string | null

  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'BUSINESS_ID' })
  BUSINESS: Business

  @ManyToOne(() => ServiceVehicle, { nullable: false })
  @JoinColumn({ name: 'SERVICE_VEHICLE_ID' })
  SERVICE_VEHICLE: ServiceVehicle
}
