import chalk from 'chalk'
import boxen, { Options } from 'boxen'
import os from 'os'

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces?.[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

export function serverMessage(time: string) {
  const message = `
  ${chalk.bold.green('Serving!')}
  - Local:   ${chalk.cyan(`http://localhost:${process.env.APP_PORT}`)}
  - Network: ${chalk.cyan(`http://${getLocalIP()}:${process.env.APP_PORT}`)}

  - RabbitMQ connected!

  ${chalk.gray(`- Server ready in ${time}`)}
`

  const boxenOptions: Options = {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
  }

  console.info(boxen(message, boxenOptions))
}
