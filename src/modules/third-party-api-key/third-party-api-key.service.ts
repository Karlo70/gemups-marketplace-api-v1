import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { CreateThirdPartyApiDto } from './dto/create-third-party-api-key.dto';
import { UpdateThirdPartyApiDto } from './dto/update-third-party-api-key.dto';
import { ThirdPartyApi } from './entities/third-party-api-key.entity';
import { User } from '../users/entities/user.entity';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { EncryptionService } from 'src/shared/services/encryption.service';
import { GetAllThirdPartyApiKeyDto } from './dto/get-all-third-party-api-key.dto';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class ThirdPartyApiService {
  constructor(
    @InjectRepository(ThirdPartyApi)
    private readonly thirdPartyApiRepository: Repository<ThirdPartyApi>,
    private readonly encryptionService: EncryptionService,
  ) { }

  async create(createThirdPartyApiDto: CreateThirdPartyApiDto, currentUser: User): Promise<ThirdPartyApi> {

    const thirdPartyApi = this.thirdPartyApiRepository.create({
      ...createThirdPartyApiDto,
      created_by: currentUser,
      key: this.encryptionService.encrypt(createThirdPartyApiDto.key),
      use_for: createThirdPartyApiDto.use_for,
    });

    // console.log("🚀 ~ ThirdPartyApiService ~ create ~ thirdPartyApi:", this.encryptionService.decrypt(thirdPartyApi.key))

    return await thirdPartyApi.save();
  }

  async findAll(currentUser: User, getAllThirdPartyApiKeyDto: GetAllThirdPartyApiKeyDto) {
    const {
      search,
      page = 1,
      per_page = 10,
      from,
      to,
      type,
      use_for,
    } = getAllThirdPartyApiKeyDto;

    const queryBuilder = this.thirdPartyApiRepository
      .createQueryBuilder('thirdPartyApi')
      .leftJoinAndSelect('thirdPartyApi.created_by', 'created_by')
      .where('thirdPartyApi.deleted_at IS NULL')
      .orderBy('thirdPartyApi.created_at', 'DESC');

    // Add type filter
    if (type) {
      queryBuilder.andWhere('thirdPartyApi.type = :type', { type });
    }

    // Add use_for filter
    if (use_for) {
      queryBuilder.andWhere('thirdPartyApi.use_for = :use_for', { use_for });
    }

    // Add search filter
    if (search) {
      queryBuilder.andWhere(
        '(thirdPartyApi.name ILIKE :search OR thirdPartyApi.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Add date range filters
    if (from) {
      queryBuilder.andWhere('thirdPartyApi.created_at >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('thirdPartyApi.created_at <= :to', { to });
    }

    const paginationOptions: IPaginationOptions = {
      limit: per_page,
      page,
    }
    const thirdPartyApis = await paginate(queryBuilder, paginationOptions);

    return thirdPartyApis
  }

  async findOne({ id }: ParamIdDto, currentUser: User): Promise<ThirdPartyApi> {
    const thirdPartyApi = await this.thirdPartyApiRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!thirdPartyApi) {
      throw new NotFoundException('Third party API not found');
    }

    return thirdPartyApi;
  }

  async update({ id }: ParamIdDto, updateThirdPartyApiDto: UpdateThirdPartyApiDto, currentUser: User): Promise<ThirdPartyApi> {
    const thirdPartyApi = await this.thirdPartyApiRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!thirdPartyApi) {
      throw new NotFoundException('Third party API not found');
    }

    if (updateThirdPartyApiDto?.key) {
      updateThirdPartyApiDto.key = this.encryptionService.encrypt(updateThirdPartyApiDto.key);
    }

    Object.assign(thirdPartyApi, updateThirdPartyApiDto);

    const savedThirdPartyApi = await this.thirdPartyApiRepository.save(thirdPartyApi);

    return savedThirdPartyApi;
  }

  async remove({ id }: ParamIdDto, currentUser: User): Promise<ThirdPartyApi> {
    const thirdPartyApi = await this.findOne({ id }, currentUser);

    thirdPartyApi.deleted_at = new Date();

    return await this.thirdPartyApiRepository.save(thirdPartyApi);
  }

  async markDefault({ id }: ParamIdDto, currentUser: User): Promise<ThirdPartyApi> {
    const thirdPartyApi = await this.thirdPartyApiRepository.findOne({
      where: { id, deleted_at: IsNull() },
    });

    if (!thirdPartyApi) {
      throw new NotFoundException('Third party API not found');
    }

    await this.thirdPartyApiRepository.update(
      { id: Not(id), deleted_at: IsNull(), type: thirdPartyApi.type, is_default: true },
      { is_default: false }
    );

    thirdPartyApi.is_default = true;
    return await thirdPartyApi.save();
  }
}
