export declare class AppService {
    getHealth(): {
        status: string;
        timestamp: string;
    };
    getInfo(): {
        name: string;
        version: string;
        description: string;
        environment: string;
    };
}
