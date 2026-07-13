import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { EmailService } from '../email/email.service';

@Module({
  imports: [JwtModule.register({}), PassportModule, CacheModule.register({ ttl: 900000, })],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, EmailService],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
