import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'usuario@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Código de 6 dígitos enviado por correo',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ example: 'nuevaClave123' })
  @IsString()
  @Length(6, 20)
  newPassword!: string;
}
