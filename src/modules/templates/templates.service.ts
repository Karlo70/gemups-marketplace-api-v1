import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { GetAllTemplatesDto } from './dto/get-all-templates.dto';
import { Template } from './entities/template.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templatesRepository: Repository<Template>,
  ) {}

  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const template = this.templatesRepository.create(createTemplateDto);
    return await template.save();
  }

  async findAll(getAllDto: GetAllTemplatesDto) {
    const { page, per_page, search, type, start_date, end_date } = getAllDto;

    const query = this.templatesRepository
      .createQueryBuilder('templates')
      .where('templates.deleted_at IS NULL')
      .orderBy('templates.created_at', 'DESC');

    if (search) {
      query.andWhere(
        `(templates.name ILIKE :search OR templates.description ILIKE :search OR templates.subject ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    if (type) {
      query.andWhere('templates.type = :type', { type });
    }

    if (start_date) {
      query.andWhere('templates.created_at >= :start_date', { start_date });
    }

    if (end_date) {
      query.andWhere('templates.created_at <= :end_date', { end_date });
    }

    const paginationOptions: IPaginationOptions = {
      page: page ?? 1,
      limit: per_page ?? 10,
    };

    return await paginate<Template>(query, paginationOptions);
  }

  async findOne({ id }: ParamIdDto): Promise<Template> {
    const template = await this.templatesRepository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async update(
    { id }: ParamIdDto,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.findOne({ id });

    Object.assign(template, updateTemplateDto);
    return await template.save();
  }

  async remove({ id }: ParamIdDto): Promise<void> {
    const template = await this.findOne({ id });
    
    template.deleted_at = new Date();
    await template.save();
  }
}
