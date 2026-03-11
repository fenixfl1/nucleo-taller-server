import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import http from 'http'
import { AppDataSource } from './data-source'
import { serverMessage } from '@helpers/server-message'
import routes from './api/routes'
import { errorHandler } from './api/middlewares/error.middleware'
import { startConsumer } from './api/services/email/email-consumer.service'
import { initSocket } from './realtime/socket'

const start = performance.now()

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST',
  credentials: false,
}

async function init() {
  const app = express()

  app.use(cors(corsOptions))
  app.use(cookieParser())
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(routes)
  app.use(errorHandler)

  await AppDataSource.initialize()

  const server = http.createServer(app)
  initSocket(server)
  server.listen(process.env.APP_PORT)

  serverMessage(`${(performance.now() - start).toFixed(2)} ms`)
}

init()
  .then(async () => await startConsumer())
  .catch((error) => {
    console.error(' 💥 Something went wrong: ', error)
    process.exit(1)
  })
