import bcrypt from "bcrypt";
import { IPasswordHasher } from "../interfaces/password-hasher.interface.js";

export class BcryptPasswordHasher implements IPasswordHasher {
    constructor(private readonly cost: number) {}

    async hash(password: string): Promise<string> {
        return await bcrypt.hash(password, this.cost);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }
}
