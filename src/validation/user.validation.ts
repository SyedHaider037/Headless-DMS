import { z } from "zod";

export const registerSchema = z.object({
    username: z.string("Username is required"),
    email: z.email({ message: "Invalid email address" }),
    password: z.string("Password is required"),
});

export const loginSchema = z.object ({
    email: z.email({ message: "Invalid email address" }),
    password: z.string("Password is required").min(1, "Password is required"),
})
