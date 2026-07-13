import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; // Importa tu módulo global de emails

@Module({
  imports: [
    PrismaModule, 
    EmailModule, // Se agrega a los imports organizados
    JwtModule.register({}), 
    PassportModule, 
    CacheModule.register({ ttl: 900000 })
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard], // Limpiamos EmailService de aquí
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}