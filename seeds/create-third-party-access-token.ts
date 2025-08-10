import {
  Platform,
  ThirdPartyAccessToken,
} from 'src/modules/webhooks/entities/third-party-access-token.entity';
import { DataSource } from 'typeorm';

export const createAccessToken = async (AppDataSource: DataSource) => {
  const accessTokenRepository = AppDataSource.getRepository(
    ThirdPartyAccessToken,
  );

  const access_token =
    'EAATZCy8mt5aABPHrkTIf8X4e8XL2MHHMDBNv7oRfdYqa7w4TaVIVs409RQFeqLwxnNZBjniAwNEsOV7gCLH585JAJxnWXjykYUWFjJUTBBk6ZAJl5cZBpoY8ZBMaW7crILZAHsPqdwyZB7HPFuAZCqfjAXFYdgOPY3jvI3wwK178NSfnZAGCLaZBk87ZCOaQKXieDtH8LkmEOEUc6eNwTBvwbyalvnX8CdeqEP6';

  const existingAccessToken = await accessTokenRepository.findOne({
    where: {
      short_lived_access_token: access_token,
    },
  });

  if (existingAccessToken) {
    console.log('Access token already exist');
    return;
  }

  const newAccessToken = accessTokenRepository.create({
    short_lived_access_token: access_token,
    platform: Platform.FACEBOOK,
    expires_at: 5183999,
  });
  await accessTokenRepository.save(newAccessToken);

  console.log('Access token created successfully.');
};
