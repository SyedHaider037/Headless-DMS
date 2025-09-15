export interface IUser {
    findByEmailOrUsername(email: string, username: string): Promise<any>;
    findRoleByName(roleName: string): Promise<any>;
    createUser(data: { username: string; email: string; password: string; roleId: string}): Promise<any>;
    findByEmail(email: string): Promise<any>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<any>;
    findByIdAndToken(userId: string, refreshToken: string): Promise<any>;
}