import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';  
import { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { randomInt } from 'crypto';
import { EmailService } from '../email/email.service';
import { getForgotPasswordTemplate } from './email.template';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: any,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.username ? [{ username: dto.username }] : []),
        ],
      },
    });
    if (existing) {
      if (existing.email === dto.email)
        throw new ConflictException('Email already registered');
      throw new ConflictException('Username already taken');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        state: 'ACTIVE',
        role: 'USER',
      },
    });
    const auth = await this.prisma.userAuth.create({
      data: {
        userId: user.id,
        provider: 'local',
        passwordHash: hash,
        createdAt: new Date(),
      },
    });
    const tokens = await this.generateTokens(user.id, auth.id);
    await this.prisma.userAuth.update({
      where: { id: auth.id },
      data: { refreshToken: tokens.refreshToken },
    });
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException();

    const auth = await this.prisma.userAuth.findFirst({
      where: { userId: user.id, provider: 'local' },
    });
    if (!auth?.passwordHash) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.password, auth.passwordHash);
    if (!valid) throw new UnauthorizedException();

    const tokens = await this.generateTokens(user.id, auth.id);
    await this.prisma.userAuth.update({
      where: { id: auth.id },
      data: { refreshToken: tokens.refreshToken },
    });
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refresh(dto: RefreshDto): Promise<AuthResponseDto> {
    const payload = await this.jwt
      .verifyAsync<{ sub: string; authId: string }>(dto.refreshToken, {
        secret:
          this.config.get('JWT_REFRESH_SECRET') ||
          this.config.get('JWT_SECRET'),
      })
      .catch(() => null);
    if (!payload) throw new UnauthorizedException();

    const auth = await this.prisma.userAuth.findFirst({
      where: { refreshToken: dto.refreshToken },
    });
    if (!auth) throw new UnauthorizedException();

    const user = await this.prisma.user.findUnique({
      where: { id: auth.userId },
    });
    if (!user) throw new UnauthorizedException();

    const tokens = await this.generateTokens(auth.userId, auth.id);
    await this.prisma.userAuth.update({
      where: { id: auth.id },
      data: { refreshToken: tokens.refreshToken },
    });
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.userAuth.updateMany({
        where: { refreshToken },
        data: { refreshToken: null },
      });
    } else {
      await this.prisma.userAuth.updateMany({
        where: { userId },
        data: { refreshToken: null },
      });
    }
    return { success: true };
  }

async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: true, message: 'Si el correo está registrado, recibirás un email con instrucciones.' };
    } 

    // Generamos el código de 6 dígitos
    const code = randomInt(100000, 1000000).toString();
    const cacheKey = `reset:${email}`;

    // Guardamos en la caché administrada por Keyv con un TTL específico de 15 minutos
    await this.cacheManager.set(cacheKey, code, 900000);
    this.logger.log(`Código temporal de recuperación guardado en Keyv Cache para: ${email}`);

    const htmlContent = `<p>Tu código de recuperación es: <strong>${code}</strong></p>`;

    try {
      await this.emailService.send(
        email,
        'Código de verificación - Restablecer Contraseña',
        htmlContent,
      );
    } catch (error: any) {
      this.logger.error(`Error enviando correo de recuperación a ${email}: ${error.message}`);
    }

    return { success: true };
  }

  private sanitizeUser(user: any): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio,
      pronouns: user.pronouns,
      birthDate: user.birthDate,
      coverPic: user.coverPic,
      role: user.role,
      state: user.state,
      profilePic: user.profilePic,
      verified: user.verified,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(userId: string, authId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, authId },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: this.config.get('JWT_EXPIRATION'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId, authId },
        {
          secret:
            this.config.get('JWT_REFRESH_SECRET') ||
            this.config.get('JWT_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
