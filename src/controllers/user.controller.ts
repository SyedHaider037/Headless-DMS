import { Request, Response } from "express";
import { registerSchema, loginSchema } from "../validation/user.validation";
import { UserService } from "../services/user.service";

const options = {
    httpOnly : true,
    secure : true,
    sameSite: 'strict' as const,
    maxAge: 5 * 24 * 60 * 60 * 1000,
}

const userService = new UserService();

export const RegisterUser = async (req: Request, res: Response ) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        
        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed", details: parsed.error.issues});
        }

        const {username, email, password, role} = parsed.data;

        const createdUser = await userService.register(username, email, password, role);
            
        return res.status(201).json({ user : createdUser , message: "User registered successfully"});
    } catch (error: any ) {
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

}


export const loginUser = async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: "Validation failed",  details: parsed.error.issues});
        }

        const { email, password } = parsed.data;

        const { userData, accessToken, refreshToken } = await userService.login(email, password);
        
        console.log("User logged in successfully:", userData);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)  
            .json({
                user: userData,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                message: "User logged in successfully"
            });
    } catch (error: any) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const logoutUser = async(req: Request, res: Response) => {

    try {

        if (!req.user) {
            return res.status(400).json({ error: "No token provoided"});
        }
        
        const user = await userService.logout(req.user.id);
            
        return res.status(200)
                .clearCookie("accessToken", options)
                .clearCookie("refreshToken", options)
                .json({ LogOutUser: user ,message :"User logged out successfully"})
            
    } catch (error: any) {
        console.error("Logout Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
    
}

export const refreshToken = async (req: Request, res: Response) => {
    
    try {
        const oldRefreshToken = req.cookies.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({ error: "No refresh token provided" });
        } 

        const { accessToken, refreshToken } = await userService.refreshToken(oldRefreshToken);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({ 
                accessToken, 
                message: "Access token refreshed successfully" 
            });

    } catch (error: any) {
        console.error("Refresh Token Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
