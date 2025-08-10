import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CronLogService } from './cron-log.service';
import { CreateCronLogDto } from './dto/create-cron-log.dto';
import { UpdateCronLogDto } from './dto/update-cron-log.dto';

@Controller('cron-log')
export class CronLogController {
  constructor(private readonly cronLogService: CronLogService) {}

  @Post()
  create(@Body() createCronLogDto: CreateCronLogDto) {
    return this.cronLogService.create(createCronLogDto);
  }

  @Get()
  findAll() {
    return this.cronLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cronLogService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCronLogDto: UpdateCronLogDto) {
    return this.cronLogService.update(+id, updateCronLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cronLogService.remove(+id);
  }
}
