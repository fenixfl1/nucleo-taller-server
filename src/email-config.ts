import { google } from 'googleapis'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

const parseBoolean = (value?: string, fallback = true): boolean => {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase())
}

export async function getEmailConfig(): Promise<SMTPTransport.Options> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465)
  const user = process.env.NODEMAILER_USER?.trim()

  if (!user) {
    throw new Error('NODEMAILER_USER no configurado.')
  }

  const appPassword = (
    process.env.NODEMAILER_APP_PASSWORD || process.env.NODEMAILER_PASS
  )?.trim()
  if (appPassword) {
    return {
      host,
      port,
      secure,
      auth: {
        user,
        pass: appPassword,
      },
    }
  }

  const clientId = process.env.CLIENT_ID?.trim()
  const clientSecret = process.env.CLIENT_SECRET?.trim()
  const redirectUri = process.env.REDIRECT_URI?.trim()
  const refreshToken = process.env.REFRESH_TOKEN?.trim()

  if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
    throw new Error(
      'Falta configuración de correo. Define NODEMAILER_APP_PASSWORD/NODEMAILER_PASS o credenciales OAuth2.'
    )
  }

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  )

  oAuth2Client.setCredentials({ refresh_token: refreshToken })
  const accessToken = await oAuth2Client.getAccessToken()

  return {
    host,
    port,
    secure,
    auth: {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: accessToken.token || undefined,
    },
  }
}
