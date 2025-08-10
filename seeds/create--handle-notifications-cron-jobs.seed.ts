import { CronExpression } from '@nestjs/schedule';
import { CreateCronJobDto } from 'src/modules/cron-job/dto/create-cron-job.dto';
import { CronJob } from 'src/modules/cron-job/entities/cron-job.entity';
import { DataSource, In } from 'typeorm';

export const createHandleNotificationsCronJob = async (AppDataSource: DataSource) => {
  const cronjobRepository = AppDataSource.getRepository(CronJob);

  const cronjobToCreate: CreateCronJobDto[] = [
    {
      name: 'Handle Notifications',
      description:
        'Responsible for sending notifications calls and emails to the leads.',
      cron_expression: CronExpression.EVERY_10_SECONDS,
    },
  ];

  const existingAgents = await cronjobRepository.find({
    where: {
      name: In(cronjobToCreate.map((a) => a.name)),
    },
  });

  const existingNames = new Set(existingAgents.map((a) => a.name));
  const filteredAgents = cronjobToCreate.filter(
    (a) => !existingNames.has(a.name),
  );

  if (filteredAgents.length === 0) {
    console.log('All cronjobs already exist');
    return;
  }

  const newAgentEntities = cronjobRepository.create(filteredAgents);
  await cronjobRepository.save(newAgentEntities);

  console.log('Cron jobs created successfully.');
};
