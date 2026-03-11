import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import ms from 'ms'
import { BadRequestError, UnAuthorizedError } from '@api/errors/http.error'
import { BaseService, CatchServiceError } from './base.service'
import moment from 'moment'
import { normalizeUnit } from '@helpers/normalize-unit'
import { Staff } from '@entity/Staff'
import { ApiResponse } from '@src/types/api.types'
import { publishEmailToQueue } from './email/email-producer.service'
import PasswordResetToken from '@src/entity/PasswordReset'
import { randomBytes } from 'crypto'
import { Repository } from 'typeorm'
import { generatePassword } from '@src/helpers/generate-password'
import { Role } from '@src/entity/Role'

interface LoginPayload {
  username: string
  password: string
}

export class AuthService extends BaseService {
  private roleRepository: Repository<Role>
  private resetPasswordRepository: Repository<PasswordResetToken>

  constructor() {
    super()
    this.roleRepository = this.datasource.getRepository(Role)
    this.resetPasswordRepository =
      this.datasource.getRepository(PasswordResetToken)
  }

  async login({ username, password }: LoginPayload) {
    const staff = await this.staffRepository
      .createQueryBuilder('U')
      .addSelect('U.PASSWORD')
      .where('U.USERNAME = :username', { username })
      .getOne()

    if (!staff) {
      throw new UnAuthorizedError('Usuario o contraseña incorrectos')
    }

    const [role] = await this.roleRepository.find({
      where: {
        STATE: 'A',
        ROLE_ID: staff.ROLE_ID,
      },
    })

    if (!role) {
      throw new UnAuthorizedError(
        'No puedo iniciar sesión porque aún no tiene un rol asignado.\
         Póngase en contacto con el equipo de soporte.'
      )
    }

    const business = await this.getBusinessInfo([
      'BUSINESS_ID',
      'ADDRESS',
      'LOGO',
      'NAME',
      'PHONE',
      'RNC',
    ])

    const isPasswordValid = await bcrypt.compare(
      password,
      staff?.PASSWORD as string
    )
    if (!isPasswordValid) {
      throw new UnAuthorizedError('Usuario o contraseña incorrectos')
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new BadRequestError('JWT_SECRET no configurado')
    }

    const token = jwt.sign(
      {
        username,
        userId: staff.STAFF_ID,
      },
      secret,
      {
        expiresIn: (process.env.SESSION_EXPIRATION_TIME +
          process.env.SESSION_EXPIRATION_MAGNITUDE) as ms.StringValue,
      }
    )

    await this.loginLog(staff)

    return this.success({
      data: {
        username,
        roleId: String(role.ROLE_ID),
        userId: staff.STAFF_ID,
        // name: `${staff.STAFF.NAME} ${staff.STAFF.LAST_NAME}`,
        avatar: staff.AVATAR,
        business,
        sessionCookie: {
          expiration: this.getSessionExpirationDate(),
          token,
        },
      },
    })
  }

  private getSessionExpirationDate(): string {
    const date = moment()
    const magnitude = normalizeUnit(
      process.env.SESSION_EXPIRATION_MAGNITUDE as ms.Unit
    )

    const expiration = date.add(
      Number(process.env.SESSION_EXPIRATION_TIME),
      magnitude
    )

    return expiration.toISOString()
  }

  @CatchServiceError()
  private async loginLog(staff: Staff): Promise<void> {
    const current =
      typeof staff.LOGIN_COUNT === 'number' ? staff.LOGIN_COUNT : 0
    // await this.userRepository.update(staff, {
    //   LOGIN_COUNT: current + 1,
    //   LAST_LOGIN: new Date(),
    // })
  }

  async requestPasswordReset(
    EMAIL: string,
    USERNAME: string
  ): Promise<ApiResponse> {
    // const staff = await this.getUser(USERNAME)
    // const staff = await this.getStaff(staff.STAFF_ID)
    // const business = await this.getBusinessInfo()

    // if (staff.EMAIL !== EMAIL) {
    //   this.fail('No pudimos validar su información')
    // }

    // const token = randomBytes(32).toString('hex')
    // const expiresAt = new Date(Date.now() + 1000 * 60 * 1)

    // const resetToken = this.resetPasswordRepository.create({
    //   USER: staff,
    //   TOKEN: token,
    //   EXPIRES_AT: expiresAt,
    // })
    // await this.resetPasswordRepository.save(resetToken)

    // const url = `${
    //   process.env.APP_URL
    // }/reset_password/${token}?expires=${expiresAt.getTime()}`

    // await publishEmailToQueue({
    //   to: EMAIL,
    //   subject: 'Recuperación de contraseña',
    //   templateName: 'forgot-password',
    //   text: '',
    //   record: {
    //     name: `${staff.NAME} ${staff.LAST_NAME}`,
    //     business,
    //     url,
    //     year: new Date().getFullYear(),
    //   },
    // })

    return this.success({
      message:
        'Hemos enviado un correo electrónico con las instrucciones para recuperar tu contraseña.',
    })
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const tokenRecord = await this.resetPasswordRepository.findOne({
      where: { TOKEN: token },
      relations: ['STAFF'],
    })

    if (!tokenRecord || tokenRecord.EXPIRES_AT < new Date()) {
      throw new Error('Token inválido o expirado')
    }

    // const staff = tokenRecord.USER
    // const staff = await this.getStaff(staff.STAFF_ID)
    // const business = await this.getBusinessInfo()

    // const { hash } = await generatePassword(password)

    // staff.PASSWORD_HASH = hash

    // await this.userRepository.save(staff)
    // await this.resetPasswordRepository.delete(tokenRecord)

    // await publishEmailToQueue({
    //   to: staff.EMAIL,
    //   subject: 'Recuperación de contraseña',
    //   templateName: 'password-changed',
    //   text: '',
    //   record: {
    //     name: `${staff.NAME} ${staff.LAST_NAME}`,
    //     business,
    //     url: `${process.env.APP_URL}/login`,
    //     year: new Date().getFullYear(),
    //   },
    // })

    return this.success({
      message:
        'Su contraseña ha sido actualizada correctamente. Ya puede iniciar sesión.',
    })
  }
}
