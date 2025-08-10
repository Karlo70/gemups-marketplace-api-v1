import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class EncryptionService {
    private readonly secretKey: string;
    // Function to encrypt text
    constructor(
        private readonly configService: ConfigService,
    ) {
        this.secretKey = this.configService.get('ENCRYPTION_SECRET_KEY') as string;
    }

    encrypt(text: string) {
        const iv = crypto.randomBytes(16); // Initialization vector
        const key = crypto.scryptSync(this.secretKey, 'salt', 32); // Derive a 256-bit key
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Return iv + encrypted data (hex)
        return iv.toString('hex') + ':' + encrypted;
    }

    // Function to decrypt text
    decrypt(encryptedText: string) {
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = crypto.scryptSync(this.secretKey, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
