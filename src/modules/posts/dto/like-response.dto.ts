import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty()
  postId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ nullable: true })
  username: string | null;

  @ApiProperty()
  liked: boolean;

  @ApiProperty({ nullable: true })
  likesCounter: number | null;
}