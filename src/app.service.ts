import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }

    getInfo() {
        return {
            name: 'Mansi Jewellery API',
            version: '1.0.0',
            description: 'Luxury International Jewellery E-Commerce Platform',
            environment: process.env.NODE_ENV || 'development',
        };
    }
}
