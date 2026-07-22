import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;

export class AccountSettingsDto {
  @ApiPropertyOptional({ description: 'Recibir notificaciones y avisos' })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiPropertyOptional({ description: 'Cuenta privada' })
  @IsOptional()
  @IsBoolean()
  privateAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Mostrar la fecha de nacimiento en el perfil público',
  })
  @IsOptional()
  @IsBoolean()
  showBirthDate?: boolean;

  @ApiPropertyOptional({ description: 'Efectos de sonido de la app' })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional({ enum: ['alegre', 'suave', 'clasico', 'silencio'] })
  @IsOptional()
  @IsString()
  @IsIn(['alegre', 'suave', 'clasico', 'silencio'])
  soundType?: 'alegre' | 'suave' | 'clasico' | 'silencio';

  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES })
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: (typeof SUPPORTED_LANGUAGES)[number];
}

export const DEFAULT_ACCOUNT_SETTINGS: Required<AccountSettingsDto> = {
  notifications: true,
  privateAccount: false,
  showBirthDate: false,
  soundEnabled: true,
  soundType: 'alegre',
  language: 'es',
};
