import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";

type MyToken = {
    id: string;
    email: string;
    username: string;
}    

const repo = new UserRepository();

export class AuthService {

    static async verifyToken(token: string): Promise<any> {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as MyToken;
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Token expired");
            }
            throw new Error("Invalid token");    
        }

        if(!decoded.id) throw new Error("Invalid token payload");

        const user = await repo.findById(decoded.id);

        if (!user) throw new Error("User not found");

        return user;
    }
}