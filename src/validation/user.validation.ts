import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(8, { message: "Username should be 8 characters long" }),
    email: z.email({ message: "Invalid email address" }), 
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
    role : z.enum(["ADMIN", "USER"], { message : "Role must be either ADMIN or USER"}),
});

export const loginSchema = z.object ({
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
})