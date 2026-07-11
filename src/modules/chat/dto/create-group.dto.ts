import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name', example: 'Squad Goals' })
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiProperty({ required: false, description: 'Group picture URL' })
  @IsString()
  @IsOptional()
  groupPic?: string;

  @ApiProperty({
    description: 'Initial member UUIDs (excluding creator)',
    minItems: 2,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1, { message: 'At least 1 other member required' })
  memberIds: string[];
}
