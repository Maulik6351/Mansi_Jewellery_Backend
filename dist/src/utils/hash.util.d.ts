export declare class HashUtil {
    static hash(password: string): Promise<string>;
    static compare(password: string, hash: string): Promise<boolean>;
}
