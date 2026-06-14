import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller()
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.auth.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
    return this.auth.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@Req() req: any, @Body() dto: LogoutDto) {
    return this.auth.logout(req.user.userId, dto.refreshToken);
  }
}
