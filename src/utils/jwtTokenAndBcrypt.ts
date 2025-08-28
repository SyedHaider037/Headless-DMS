import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import "dotenv/config";

export const hashPassword = async(password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

export const verifyPassword = async(actualPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(actualPassword, hashedPassword)
}

export const generateAccessToken = (payload: object): string => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"],
    });
};

export const generateRefreshToken = (payload: object): string => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY! as SignOptions["expiresIn"],
    });
}