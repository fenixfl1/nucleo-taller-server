import amqp from 'amqplib'
import EmailService from './email.service'
import { SUCCESS_CONSOLE_FONT_COLOR } from '@constants/general'

const QUEUE_NAME = 'email_queue'

export async function startConsumer() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL)
    const channel = await connection.createChannel()

    await channel.assertQueue(QUEUE_NAME)
    console.info(
      SUCCESS_CONSOLE_FONT_COLOR,
      ` 🟢 Escuchando mensajes en la cola: ${QUEUE_NAME}`
    )

    const emailService = new EmailService()

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString())

          await emailService.send(data)
          channel.ack(msg)
        } catch (err) {
          console.error(' ❌ Error procesando el mensaje:', err)
        }
      }
    })
  } catch (err) {
    console.error(' ❌ Error al iniciar el consumidor:', err)
  }
}
