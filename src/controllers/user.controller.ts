import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../validation/user.validation";
import { UserService } from "../services/user.service";
import { UserRepository } from "../repositories/user.repository";
import { matchRes } from "@carbonteq/fp";
import jwt from "jsonwebtoken";

const options = {
    httpOnly : true,
    secure : true,
    sameSite: 'strict' as const,
    maxAge: 5 * 24 * 60 * 60 * 1000,
}

const userService = new UserService(new UserRepository());

export const RegisterUser = async (req: Request, res: Response ) => {
    
    const parsed = registerSchema.safeParse(req.body);
        
    if (!parsed.success) {
        return res.status(400).json({ error: "Validation failed", details: parsed.error.issues});
    }

    const {username, email, password, role} = parsed.data;

    const createdUser = await userService.register({username, email, password, role});
        
    return matchRes(createdUser, {
        Ok: (user) =>  res.status(201).json({ user, message: "User registered successfully"}),
        Err: (err) => {
            console.error("Registration Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    })
}


export const loginUser = async (req: Request, res: Response) => {
    
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed",  details: parsed.error.issues});
        }

        const { email, password } = parsed.data;

        const result = await userService.login({email, password});
        
        return matchRes(result,{
            Ok: ({userData, accessToken, refreshToken}) => {
                console.log("User logged in successfully:", userData);
                res
                    .status(200)
                    .cookie("accessToken", accessToken, options)
                    .cookie("refreshToken", refreshToken, options)  
                    .json({
                        user: userData,
                        accessToken: accessToken,
                        refreshToken: refreshToken, 
                        message: "User logged in successfully"
                    }); 
            },
            Err: (err) => {
                console.error("Login Error:", err);
                return res.status(500).json({ error: "Internal server error" });
            }    
        })
}

export const logoutUser = async(req: Request, res: Response) => {

    if (!req.user) {
        return res.status(400).json({ error: "No token provoided"});
    }
        
    const user = await userService.logout(req.user.id);
    
    return matchRes(user, {
        Ok: () =>
            res
                .status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json({ message :"User logged out successfully"}),
        Err:(err) => {
            console.error("Logout Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }) 
}

export const refreshToken = async (req: Request, res: Response) => {
    
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
        return res.status(401).json({ error: "No refresh token provided" });
    } 

    let decoded;
    try {
        decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as { id : string};
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(403).json({ error: "Invalid or expired refresh token" });
        }
        return res.status(500).json({ error: "Internal server error" });   
    }

    if (!decoded?.id) {
        return res.status(400).json({ error: "Invalid token payload" });
    }
        
    const result = await userService.refreshToken(decoded.id, oldRefreshToken);

    return matchRes(result,{
        Ok: ({accessToken, refreshToken}) =>  
            res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({ 
                accessToken, 
                message: "Access token refreshed successfully" 
            }),
        Err: (err) => {
            console.error("Refresh Token Error:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    });
}
