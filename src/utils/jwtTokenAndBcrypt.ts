import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "../config.js";

export const hashPassword = async(password: string): Promise<string> => {
    return await bcrypt.hash(password, config.bcryptCost);
}

export const verifyPassword = async(actualPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(actualPassword, hashedPassword)
}

export const generateAccessToken = (payload: object): string => {
    return jwt.sign(payload, config.accessToken.secret, {
        expiresIn: config.accessToken.expiry as SignOptions["expiresIn"],
    });
};

export const generateRefreshToken = (payload: object): string => {
    return jwt.sign(payload, config.refreshToken.secret,{
        expiresIn: config.refreshToken.expiry as SignOptions["expiresIn"],
    });
}