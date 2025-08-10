import { DataSource, In, Not } from 'typeorm';
import {
  Model,
  ModelStatus,
  ModelType,
} from 'src/modules/models/entities/model.entity';
import {
  AnthropicModelModel,
  CerebrasModelModel,
  DeepSeekModelModel,
  GoogleModelModel,
  GroqModelModel,
  OpenAiModelModel,
  XaiModelModel,
  DeepgramTranscriberModel,
  GoogleTranscriberModel,
  GladiaTranscriberModel,
} from '@vapi-ai/server-sdk/api/index';

export const createModel = async (AppDataSource: DataSource) => {
  const modelRepository = AppDataSource.getRepository(Model);

  const anthropicModels = Object.values(AnthropicModelModel).map((key) => {
    return {
      name: key,
      provider: 'anthropic',
      status: ModelStatus.ACTIVE,
    };
  });
  const cerebrasModels = Object.values(CerebrasModelModel).map((key) => {
    return {
      name: key,
      provider: 'cerebras',
      status: ModelStatus.ACTIVE,
    };
  });
  const deepSeekModels = Object.values(DeepSeekModelModel).map((key) => {
    return {
      name: key,
      provider: 'deep-seek',
      status: ModelStatus.ACTIVE,
    };
  });
  const googleModels = Object.values(GoogleModelModel).map((key) => {
    return {
      name: key,
      provider: 'google',
      status: ModelStatus.ACTIVE,
    };
  });
  const groqModels = Object.values(GroqModelModel).map((key) => {
    return {
      name: key,
      provider: 'groq',
      status: ModelStatus.ACTIVE,
    };
  });
  const openAiModels = Object.values(OpenAiModelModel).map((key) => {
    return {
      name: key,
      provider: 'openai',
      status: ModelStatus.ACTIVE,
    };
  });
  const xaiModels = Object.values(XaiModelModel).map((key) => {
    return {
      name: key,
      provider: 'xai',
      status: ModelStatus.ACTIVE,
    };
  });

  const deepgramTranscriberModels = Object.values(DeepgramTranscriberModel).map(
    (key) => {
      return {
        name: key,
        provider: 'deepgram',
        type: ModelType.TRANSCRIBER,
        status: ModelStatus.ACTIVE,
      };
    },
  );

  const googleTranscriberModels = Object.values(GoogleTranscriberModel).map(
    (key) => {
      return {
        name: key,
        provider: 'google',
        type: ModelType.TRANSCRIBER,
        status: ModelStatus.ACTIVE,
      };
    },
  );

  const gladiaTranscriberModels = Object.values(GladiaTranscriberModel).map(
    (key) => {
      return {
        name: key,
        provider: 'gladia',
        type: ModelType.TRANSCRIBER,
        status: ModelStatus.ACTIVE,
      };
    },
  );

  const models = [
    ...anthropicModels,
    ...cerebrasModels,
    ...deepSeekModels,
    ...googleModels,
    ...groqModels,
    ...openAiModels,
    ...xaiModels,
    ...deepgramTranscriberModels,
    ...googleTranscriberModels,
    ...gladiaTranscriberModels,
  ];

  console.log('Finding existing models ...');
  const existingModels = await modelRepository.find({
    where: {
      name: In(models.map((m) => m.name)),
    },
  });
  console.log('Total existing models found:', existingModels.length);

  const modelsToCreate = models.filter(
    (m) => !existingModels.some((em) => em.name === m.name),
  );

  const shutdownModels = await modelRepository.find({
    where: {
      name: Not(In(models.map((m) => m.name))),
    },
  });

  console.log('Total Shudown models:', shutdownModels.length);

  if (shutdownModels.length > 0) {
    console.log('Shutting down models ...');
    await modelRepository.update(
      { name: In(shutdownModels.map((m) => m.name)) },
      { status: ModelStatus.INACTIVE },
    );
    console.log('Models shut down successfully');
  }

  console.log(
    'Active models:',
    await modelRepository.update(
      { name: In(models.map((m) => m.name)) },
      { status: ModelStatus.ACTIVE },
    ),
  );

  console.log('Total models to create:', modelsToCreate.length);

  console.log('Creating models ...');
  await modelRepository.save(modelsToCreate);
  console.log('Models created successfully');

  console.log('Total models:', await modelRepository.count());
};
