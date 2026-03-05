import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import * as Subscribers from './subscribers'
import * as Migrations from './migrations'

const subscribers = Object.values(Subscribers)
const migrations = Object.values(Migrations)

config({ debug: false, quiet: true })

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: ['src/entity/**/*.{ts,js}'],
  migrations,
  subscribers,
})
