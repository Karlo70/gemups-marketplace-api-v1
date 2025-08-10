import { Injectable } from '@nestjs/common';
import { CreateCronLogDto } from './dto/create-cron-log.dto';
import { UpdateCronLogDto } from './dto/update-cron-log.dto';

@Injectable()
export class CronLogService {
  create(createCronLogDto: CreateCronLogDto) {
    return 'This action adds a new cronLog';
  }

  findAll() {
    return `This action returns all cronLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cronLog`;
  }

  update(id: number, updateCronLogDto: UpdateCronLogDto) {
    return `This action updates a #${id} cronLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} cronLog`;
  }
}
