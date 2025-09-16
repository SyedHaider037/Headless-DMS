export interface RegisterUserDTO {
    username: string;
    email: string;
    password: string;
    role: "ADMIN" | "USER";
}

export interface LoginUserDTO {
    email: string;
    password: string;
}
