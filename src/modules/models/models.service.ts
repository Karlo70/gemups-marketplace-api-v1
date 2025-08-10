import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Repository } from 'typeorm';
import { Model } from './entities/model.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { GetAllModelDto } from './dto/get-all-model.dto';
import { GetAllDto } from 'src/shared/dtos/getAll.dto';

@Injectable()
export class ModelsService {
  constructor(
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
  ) {}
  async create(createModelDto: CreateModelDto) {
    const model = this.modelRepository.create(createModelDto);
    return await this.modelRepository.save(model);
  }

  async findAll(getAllModelDto: GetAllModelDto) {
    const { provider, type, status, search } = getAllModelDto;
    const queryBuilder = this.modelRepository.createQueryBuilder('model');

    if (provider) {
      queryBuilder.where('model.provider = :provider', { provider });
    }

    if (type) {
      // TRANSCRIBER or LLM
      queryBuilder.andWhere('model.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere('model.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('model.status = :status', { status });
    }
    return await queryBuilder.getMany();
  }

  async findAllProviders(getAllModelDto: GetAllModelDto) {
    const { search, type } = getAllModelDto;
    const queryBuilder = this.modelRepository.createQueryBuilder('model');

    if (search) {
      queryBuilder.andWhere('model.provider LIKE :search', {
        search: `%${search}%`,
      });
    }
    
    if (type) {
      queryBuilder.andWhere('model.type = :type', { type });
    }

    const providers = await queryBuilder
      .select('DISTINCT provider')
      .getRawMany();
    return providers.map((provider) => provider.provider);
  }

  async findOne(id: ParamIdDto) {
    const model = await this.modelRepository.findOne({
      where: {
        id: id.id,
      },
    });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    return model;
  }

  async update(id: ParamIdDto, updateModelDto: UpdateModelDto) {
    const model = await this.modelRepository.update(id, updateModelDto);
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    return model;
  }

  async remove(id: ParamIdDto) {
    const model = await this.modelRepository.update(id, {
      deletedAt: new Date(),
    });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    return model;
  }
}
