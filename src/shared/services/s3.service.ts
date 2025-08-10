import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MemoryStoredFile } from 'nestjs-form-data';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly nodeEnv: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_S3_REGION') ?? '',
      credentials: {
        accessKeyId: this.configService.get('AWS_S3_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.configService.get(
          'AWS_S3_ACCESS_KEY_SECRET_ACCESS_KEY',
        ) ?? '',
      },
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') ?? '';
    this.region = this.configService.get('AWS_S3_REGION') ?? '';
    this.nodeEnv = this.configService.get('NODE_ENV') ?? '';
  }

  async uploadFile(file: MemoryStoredFile, folderPath: string) {
    if (!file) {
      return;
    }

    const uploadParam = {
      Bucket: this.bucketName,
      Body: file.buffer,
      Key: `${this.nodeEnv}/${folderPath}/${Date.now()}-${file.originalName.split(' ').join('-')}`,
      ContentType: file.mimeType,
    };

    const response = await this.s3Client.send(
      new PutObjectCommand(uploadParam),
    );

    if (response.$metadata.httpStatusCode === 200) {
      return `https://s3.${this.region}.amazonaws.com/${this.bucketName}/${uploadParam.Key}`;
    } else {
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadMultipleFiles(files: MemoryStoredFile[], folderPath: string) {
    if (!files || files.length === 0) {
      return [];
    }

    const uploadPromises = files.map(async (file) => {
      const uploadParam = {
        Bucket: this.bucketName,
        Body: file.buffer,
        Key: `${this.nodeEnv}/${folderPath}/${Date.now()}-${file.originalName.split(' ').join('-')}`,
        ContentType: file.mimeType,
      };
      return this.s3Client
        .send(new PutObjectCommand(uploadParam))
        .then((response) => {
          if (response.$metadata.httpStatusCode === 200) {
            return `https://s3.${this.region}.amazonaws.com/${this.bucketName}/${uploadParam.Key}`;
          } else {
            throw new BadRequestException(
              `Failed to upload file: ${file.originalName}`,
            );
          }
        });
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  }

  async deleteFile(url: string) {
    if (!url) {
      return;
    }

    function extractS3Key(
      fileUrl: string,
      bucketName: string,
      region: string,
    ): string {
      const baseUrl = `https://s3.${region}.amazonaws.com/${bucketName}/`;
      return fileUrl.replace(baseUrl, '');
    }

    const fileKey = extractS3Key(url, this.bucketName, this.region);

    const deleteParams = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    await this.s3Client.send(new DeleteObjectCommand(deleteParams));
  }

  async deleteMultipleFiles(fileUrls: string[]) {
    if (!fileUrls || fileUrls.length === 0) {
      return;
    }

    function extractS3Key(
      fileUrl: string,
      bucketName: string,
      region: string,
    ): string {
      const baseUrl = `https://s3.${region}.amazonaws.com/${bucketName}/`;
      return fileUrl.replace(baseUrl, '');
    }

    // Convert URLs to S3 file keys
    const fileKeys = fileUrls.map((url) =>
      extractS3Key(url, this.bucketName, this.region),
    );

    const deleteParams = {
      Bucket: this.bucketName,
      Delete: {
        Objects: fileKeys.map((fileKey) => ({
          Key: fileKey,
        })),
      },
    };

    await this.s3Client.send(new DeleteObjectsCommand(deleteParams));
  }
}
