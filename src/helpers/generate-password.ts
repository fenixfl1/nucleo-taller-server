import * as crypto from 'crypto'
import * as bcrypt from 'bcrypt'

export async function generatePassword(pass?: string): Promise<{
  password: string
  hash: string
}> {
  const password = pass || crypto.randomBytes(8).toString('hex')
  const hashedPassword = await bcrypt.hash(password, 10)

  return { password, hash: hashedPassword }
}
