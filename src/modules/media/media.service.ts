import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Media, MediaType } from './entities/media.entity';
import { Repository } from 'typeorm';
import { AuthenticationGuard } from 'src/shared/guards/authentication.guard';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { MediaSize } from './enums/media-size.enum';
import { User } from '../users/entities/user.entity';
import { S3Service } from 'src/shared/services/s3.service';

@Injectable()
@UseGuards(AuthenticationGuard)
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly mediaRepo: Repository<Media>,
    private readonly s3Service: S3Service,
  ) {}

  async createMedia(
    currentUser: User,
    createMediaDto: CreateMediaDto,
  ): Promise<Media> {
    const { file, folder_path } = createMediaDto;

    const fileType = file.mimeType.split('/')[0];

    let type: MediaType = MediaType.IMAGE;

    if (fileType === MediaType.IMAGE) {
      if (file.size > MediaSize.IMAGE_SIZE_LIMIT) {
        throw new BadRequestException('Image size should not exceed 10MB');
      }
      type = MediaType.IMAGE;
    }

    if (fileType === MediaType.VIDEO) {
      if (file.size > MediaSize.VIDEO_SIZE_LIMIT) {
        throw new BadRequestException('Video size should not exceed 100MB');
      }
      type = MediaType.VIDEO;
    }

    if (fileType === 'application' && file.mimeType.includes('pdf')) {
      type = MediaType.PDF;
    }

    const url = await this.s3Service.uploadFile(file, folder_path);
    const media = this.mediaRepo.create({
      type: type ?? MediaType.IMAGE,
      url,
      created_by: currentUser,
    });

    return await media.save();
  }

  async deleteMedia(currentUser: User, { id }: ParamIdDto) {
    const media = await this.mediaRepo.findOne({
      where: {
        id,
        created_by: {
          id: currentUser.id,
        },
      },
    });

    if (!media) throw new NotFoundException('Media not found');

    await this.s3Service.deleteFile(media?.url);

    await this.mediaRepo.remove(media);
  }

  async deleteMultipleFiles({ id }: ParamIdDto) {
    // const media = await this.mediaRepo.find({
    //   where: {
    //     entity_id: id,
    //   },
    // });
    // if (media.length) {
    //   const fileUrls = media.map((item) => item.url);
    //   await this.s3Service.deleteMultipleFiles(fileUrls);
    //   await this.mediaRepo.delete({
    //     entity_id: id,
    //   });
    //   return;
    // }
  }
}
