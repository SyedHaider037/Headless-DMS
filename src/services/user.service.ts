import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from "../utils/jwtTokenAndBcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";

export class UserService {
    private repo: UserRepository;
    constructor() {
        this.repo = new UserRepository();
    }

    async register(username: string, email: string, password: string, role: string): Promise<any> {

        const existingUser = await this.repo.findByEmailOrUsername(email, username);
        if (existingUser) {
            throw new Error("User with this email or username already exists");
        }    

        const hashedPassword = await hashPassword(password);
        
        const roleRecord = await this.repo.findRoleByName(role);
        
        if(!roleRecord.id) {
            throw new Error("Invalid role provided");
        }   
        
        const createdUser = await this.repo.createUser({
            username,
            email,
            password: hashedPassword,
            roleId: roleRecord.id,
        });
        
        if (!createdUser) {
            throw new Error("Failed to create user");
        }

        return createdUser;
    };

    async login(email: string, password: string): Promise<any> {
        const user = await this.repo.findByEmail(email);
        if (!user) {
            throw new Error("User not found");
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        const accessToken = generateAccessToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleId
        });

        const refreshToken = generateRefreshToken({ id: user.id });

        const updatedUser = await this.repo.updateRefreshToken(user.id, refreshToken);

        if (!updatedUser) {
            throw new Error("Failed to update user with refresh token");
        }

        const {password: _password, refreshToken: _refreshToken, ...userData} = updatedUser;

        return { userData, accessToken, refreshToken };
    };

    async logout(userId: string): Promise<any> {

        const [user] = await this.repo.updateRefreshToken(userId, null);
        if (!user) {
            throw new Error("User not found or already logged out");
        }

        console.log("User logged out successfully:", user);
        return user; 
    };
    
    async refreshToken(oldRefreshToken: string): Promise<any> {       
        
        let decoded;
        try {
            decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Refresh token expired");
            }
            throw new Error("Invalid refresh token");
        }

        if (!decoded?.id) {
            throw new Error("Invalid token payload");
        }
        const [user] = await this.repo.findByIdAndToken(decoded.id, oldRefreshToken);
        
        if (!user) {
            throw new Error("User not found or invalid refresh token");
        }
        const newAccessToken = generateAccessToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleId,
        })
        const newRefreshToken = generateRefreshToken({ id: user.id });  
        await this.repo.updateRefreshToken(user.id, newRefreshToken);
        
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };    
    };    
}
