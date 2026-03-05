import nodemailer, { SentMessageInfo } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { getEmailConfig } from '@src/email-config'
import { compileTemplate } from '@helpers/email-helpers'

export interface EmailProps {
  to: string
  subject: string
  text: string
  templateName: string
  record: Record<string, any>
}

class EmailService {
  async send({
    record,
    subject,
    templateName,
    text,
    to,
  }: EmailProps): Promise<SMTPTransport.SentMessageInfo> {
    const emailConfig = await getEmailConfig()
    const transporter = nodemailer.createTransport(emailConfig)

    const html = await compileTemplate(templateName, record)

    const info = await transporter.sendMail({
      from: emailConfig.auth.user,
      to,
      subject,
      text,
      html,
    })

    return info
  }
}

export default EmailService
