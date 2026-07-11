import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class MemberActionDto {
  @ApiProperty({ description: 'Conversation UUID' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    required: false,
    description: 'Target member UUID (for role changes, removal)',
  })
  @IsUUID()
  @IsOptional()
  memberId?: string;

  @ApiProperty({
    required: false,
    description: 'Target user UUID (for adding)',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
