import { CronExpression } from '@nestjs/schedule';
import { CreateCronJobDto } from 'src/modules/cron-job/dto/create-cron-job.dto';
import { CronJob } from 'src/modules/cron-job/entities/cron-job.entity';
import { DataSource, In } from 'typeorm';

export const createCronJobs = async (AppDataSource: DataSource) => {
  const cronjobRepository = AppDataSource.getRepository(CronJob);

  const cronjobToCreate: CreateCronJobDto[] = [
    {
      name: 'Fetch Call Details',
      description:
        'Responsible for fetching call details from the CRM system and storing them in the database.',
      cron_expression: CronExpression.EVERY_MINUTE,
    },
    {
      name: 'Initiate Call',
      description:
        'Responsible for initiating calls based on the fetched call details.',
      cron_expression: CronExpression.EVERY_MINUTE,
    },
    {
      name: 'Follow Up Call',
      description:
        'Responsible for following up on calls and updating the call status in the database.',
      cron_expression: CronExpression.EVERY_10_MINUTES,
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
