import { ApiProperty } from '@nestjs/swagger';

export class ProfileDto {
  @ApiProperty()
  username: string;
}
