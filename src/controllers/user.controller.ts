import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../validation/user.validation.js";
import { container } from "../container.js";
import { sendError } from "../errors/http.js";
import { unauthorized } from "../errors/app-error.js";
import { parseInput } from "../validation/parse.js";
import { matchRes } from "@carbonteq/fp";
import { config } from "../config.js";

const options = {
    httpOnly : true,
    secure : config.isProduction,
    sameSite: 'strict' as const,
    maxAge: 5 * 24 * 60 * 60 * 1000,
}

const { userService, logger } = container;

export const RegisterUser = async (req: Request, res: Response ) => {
    
    const input = parseInput(registerSchema, req.body);
    if (input.isErr()) return sendError(res, input.unwrapErr());

    const {username, email, password} = input.unwrap();

    const createdUser = await userService.register({username, email, password});
        
    return matchRes(createdUser, {
        Ok: (user) =>  res.status(201).json({ user, message: "User registered successfully"}),
        Err: (err) => {
            logger.error("Registration failed", { error: err.message });
            return sendError(res, err);
        }
    })
}


export const loginUser = async (req: Request, res: Response) => {
    
        const input = parseInput(loginSchema, req.body);
        if (input.isErr()) return sendError(res, input.unwrapErr());

        const { email, password } = input.unwrap();

        const result = await userService.login({email, password});
        
        return matchRes(result,{
            Ok: ({userData, accessToken, refreshToken}) => {
                logger.info("User logged in", { userId: userData.id });
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
                logger.error("Login failed", { error: err.message });
                return sendError(res, err);
            }    
        })
}

export const logoutUser = async(req: Request, res: Response) => {

    if (!req.user) return sendError(res, unauthorized("Authentication required"));
        
    const user = await userService.logout(req.user.id);
    
    return matchRes(user, {
        Ok: () =>
            res
                .status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json({ message :"User logged out successfully"}),
        Err:(err) => {
            logger.error("Logout failed", { error: err.message });
            return sendError(res, err);
        }
    }) 
}

export const refreshToken = async (req: Request, res: Response) => {
    
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) return sendError(res, unauthorized("No refresh token provided"));

    const result = await userService.refreshToken(oldRefreshToken);

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
            logger.error("Token refresh failed", { error: err.message });
            return sendError(res, err);
        }
    });
}
