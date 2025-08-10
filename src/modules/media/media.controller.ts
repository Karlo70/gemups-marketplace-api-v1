import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseGuards(AuthenticationGuard)
  @FormDataRequest()
  async createMedia(
    @CurrentUser() currentUser: User,
    @Body() createMediaDto: CreateMediaDto,
  ) {
    const media = await this.mediaService.createMedia(
      currentUser,
      createMediaDto,
    );

    return {
      message: 'Media Uploaded successfully',
      details: media,
    };
  }

  @Delete(':id')
  @UseGuards(AuthenticationGuard)
  async deleteMedia(
    @CurrentUser() currentUser: User,
    @Param() paramIdDto: ParamIdDto,
  ) {
    const media = await this.mediaService.deleteMedia(currentUser, paramIdDto);
    return {
      message: 'Media deleted successfully',
      details: media,
    };
  }
}
