import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) username: string | null;
  @ApiProperty({ nullable: true }) displayName: string | null;
  @ApiProperty({ nullable: true }) email: string | null;
  @ApiProperty() role: string;
  @ApiProperty() state: string;
  @ApiProperty({ nullable: true }) profilePic: string | null;
  @ApiProperty({ nullable: true }) verified: boolean | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
