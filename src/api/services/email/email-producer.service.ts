import amqp from 'amqplib'
import { EmailProps } from './email.service'

const QUEUE_NAME = 'email_queue'

export async function publishEmailToQueue(message: EmailProps) {
  const connection = await amqp.connect(process.env.RABBITMQ_URL)
  const channel = await connection.createChannel()

  await channel.assertQueue(QUEUE_NAME)
  channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)))

  console.info(' 📤 Mensaje enviado a la cola', message.to)

  await channel.close()
  await connection.close()
}
