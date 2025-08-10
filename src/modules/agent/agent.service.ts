import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAgentDto } from './dto/create-agent.dto';
import { ParamIdDto } from 'src/shared/dtos/paramId.dto';
import { Agent } from './entities/agent.entity';
import { VapiClient } from '@vapi-ai/server-sdk';
import { ConfigService } from '@nestjs/config';
import { Model } from '../models/entities/model.entity';
import { CreateAssistantDto } from '@vapi-ai/server-sdk/api';

@Injectable()
export class AgentService {
  private readonly vapiClient: VapiClient;
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    private readonly configService: ConfigService,
  ) {
    this.vapiClient = new VapiClient({
      // environment : this.configService.get('NODE_ENV') ?? "development",
      token: this.configService.get('VAPI_API_KEY') ?? '',
    });
  }

  async create(createAgentDto: CreateAssistantDto) {
    console.log('🚀 ~ AgentService ~ create ~ createAgentDto:', createAgentDto);
    const existingAgent = await this.agentRepository.findOne({
      where: {
        name: createAgentDto['name'],
      },
    });

    if (existingAgent)
      throw new BadRequestException('Agent with same name already exists');

    const providers = await this.modelRepository
      .createQueryBuilder('model')
      .select('DISTINCT model.provider', 'provider')
      .getRawMany();

    const validProviders = providers.map((p) => p.provider);

    if (!validProviders.includes(createAgentDto.transcriber?.provider)) {
      throw new UnprocessableEntityException({
        message: 'Invalid provider',
        validProviders,
      });
    }

    const model = await this.modelRepository.findOne({
      where: {
        provider: createAgentDto.transcriber?.provider,
        type: createAgentDto['type'],
        name: createAgentDto['model'] as unknown as string, // For our platform we use string for model name
      },
    });

    // if model not found, throw error with valid models according to provider and type
    if (!model) {
      // valid models according to provider and type
      const models = await this.modelRepository.find({
        where: {
          provider: createAgentDto['provider'],
          type: createAgentDto['type'],
        },
      });

      throw new UnprocessableEntityException({
        message: 'Invalid model',
        validModels: models.map((model) => model.name),
      });
    }

    const assistant = await this.vapiClient.assistants.create(createAgentDto);

    // create agent entity
    const agentEntity = this.agentRepository.create({
      name: createAgentDto['name'],
      assistant_id: assistant.id,
    });
    return await this.agentRepository.save(agentEntity);
  }

  async update(id: ParamIdDto, agent: CreateAgentDto) {
    const agentEntity = await this.findOne(id);
    if (!agentEntity) throw new NotFoundException('Agent not found');

    return await this.agentRepository.update(id.id, agent as any);
  }

  async findOne(id: ParamIdDto) {
    const agent = await this.agentRepository.findOne({ where: id });
    if (!agent) throw new NotFoundException('Agent not found');

    return agent;
  }

  async delete(id: ParamIdDto) {
    const agent = await this.findOne(id);
    if (!agent) throw new NotFoundException('Agent not found');

    return this.agentRepository.update(id.id, { deleted_at: new Date() });
  }

  async getAgents() {
    const agents = await this.agentRepository.find();
    return agents;
  }
}
