import { Agent } from 'src/modules/agent/entities/agent.entity';
import { DataSource, In } from 'typeorm';

export const createAgents = async (AppDataSource: DataSource) => {
  const agentRepository = AppDataSource.getRepository(Agent);

  const agentsToCreate = [
    {
      name: 'Restaurant Receptionist Agent',
      assistant_id: 'aba8bf65-08f9-45a9-ab27-d5b157a53393',
      phone_number_id: '13da8106-f4c1-4178-97cc-21e417e608b6',
      firstMessage: 'Hi, Im calling from Quotes Willow Brook Restaurant for the confirmation of your reservation booked on the name of {{customerName}}, Reservation is for {{numberOfPeople}} people and the date and time for the reservation is  {{reservationDateAndTime}}. Are you coming today?',
    },
    {
      name: 'Dental Receptionist Agent',
      assistant_id: '746b27b1-3edf-417c-892c-45120c9d6877',
      phone_number_id: '13da8106-f4c1-4178-97cc-21e417e608b6',
    },
    {
      name: 'Plumbing Service Agent',
      assistant_id: '506842b2-f052-4ecc-bddc-c1c6a96e50a1',
      phone_number_id: '13da8106-f4c1-4178-97cc-21e417e608b6',
    },
  ];

  const existingAgents = await agentRepository.find({
    where: {
      name: In(agentsToCreate.map((a) => a.name)),
    },
  });

  const existingNames = new Set(existingAgents.map((a) => a.name));
  const filteredAgents = agentsToCreate.filter((a) => !existingNames.has(a.name));

  if (filteredAgents.length === 0) {
    console.log('All agents already exist');
    return;
  }

  const newAgentEntities = agentRepository.create(filteredAgents);
  await agentRepository.save(newAgentEntities);

  console.log('Agents created successfully.');
};
