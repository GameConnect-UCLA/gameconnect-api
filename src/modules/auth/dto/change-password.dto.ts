import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual del usuario' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'nuevaClave123' })
  @IsString()
  @Length(6, 20)
  newPassword!: string;
}
