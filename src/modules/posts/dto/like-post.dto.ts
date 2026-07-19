import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LikePostDto {
  @ApiProperty({ description: 'ID of the post to like or unlike' })
  @IsUUID()
  postId: string;
}
