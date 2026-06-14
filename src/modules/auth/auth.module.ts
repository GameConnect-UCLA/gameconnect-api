import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
