import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) username: string | null;
  @ApiProperty({ nullable: true }) displayName: string | null;
  @ApiProperty({ nullable: true }) email: string | null;
  @ApiProperty({ nullable: true }) bio: string | null;
  @ApiProperty({ nullable: true }) pronouns: string | null;
  @ApiProperty({ nullable: true }) birthDate: string | null;
  @ApiProperty({ nullable: true }) coverPic: string | null;
  @ApiProperty() role: string;
  @ApiProperty() state: string;
  @ApiProperty({ nullable: true }) profilePic: string | null;
  @ApiProperty({ nullable: true }) verified: boolean | null;
  @ApiProperty({ nullable: true }) createdAt: string | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
}
