import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { Model } from '../models/entities/model.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Agent, Model])],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
