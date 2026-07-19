import {
  Controller,
  Post,
  Delete,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiProperty,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';

export class DeleteMediaDto {
  @ApiProperty({ description: 'URL or relative path of the file to delete' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

@ApiTags('Media')
@Controller()
export class MediaController {
  constructor(private media: MediaService) {}

  @Post('media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.media.upload(file);
  }

  @Delete('media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete file from storage' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async remove(@Body() dto: DeleteMediaDto) {
    return this.media.remove(dto.url);
  }
}
