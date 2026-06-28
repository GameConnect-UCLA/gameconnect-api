import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user profile' })
  async getProfile(@Req() req: any) {
    const res = await this.users.findById(req.user.userId);
    console.log(res)
    return res
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update authenticated user profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.userId, dto);
  }
}
