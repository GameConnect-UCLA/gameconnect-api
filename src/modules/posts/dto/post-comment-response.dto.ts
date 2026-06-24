import { ApiProperty } from '@nestjs/swagger';

export class PostCommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  parentId: string;

  @ApiProperty({ nullable: true })
  commentParentId: string | null;

  @ApiProperty({ nullable: true })
  content: string | null;

  @ApiProperty({ type: Date, nullable: true })
  createdAt: Date | null;

   // daticos del autor pa que amarre
  @ApiProperty({ nullable: true })
  authorUsername: string | null;

  @ApiProperty({ nullable: true })
  authorDisplayName: string | null;

  @ApiProperty({ nullable: true })
  authorProfilePic: string | null;
}