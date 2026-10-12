import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken } from "../utils/jwtTokenAndBcrypt.js";
import { RegisterUserDTO, LoginUserDTO } from "../dtos/user.dto.js";
import { IUserRepository } from "../interfaces/user.interface.js";
import { Result } from "@carbonteq/fp";

export class UserService {
    constructor(private readonly repo: IUserRepository){}

    async register(data: RegisterUserDTO): Promise<Result<any, string>> {
        const { username, email, password } = data;

        return Result.Ok({email, username})
            .flatMap( async() => {
                const userExist = await this.repo.findByEmailOrUsername(email, username);
                return userExist.isOk()
                    ? Result.Err("User already exists")
                    : Result.Ok(password)
            })
            .flatMap( async() => {
                const hashedPassword = await hashPassword(password);
                return Result.Ok(hashedPassword);
            })
            .flatMap( async(hashedPassword) => {
                const roleRecord = await this.repo.findRoleByName("USER");
                return roleRecord.map((roleRecord) => ({hashedPassword, roleRecord}));
            })
            .flatMap( async({hashedPassword, roleRecord}) => await this.repo.createUser({
                username,
                email,
                password: hashedPassword,
                roleId: roleRecord.id
            }))
            .mapErr((err) => {
                console.log(`User registeration failed: ${err}`);
                return err;
            })
            .toPromise();
    };

    async login(data: LoginUserDTO): Promise<Result<any, string>> {
        const { email, password } = data;

        return Result.Ok(email)
            .flatMap( async() => await this.repo.findByEmail(email))
            .flatMap( async(user) => {
                const isPasswordValid = await verifyPassword(password, user.password);
                return isPasswordValid ? Result.Ok(user) : Result.Err("Invalid password");
            })
            .flatMap( async(user) => {
                const accessToken = generateAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId
                });
                const refreshToken = generateRefreshToken({ id: user.id });

                const updatedUser = await this.repo.updateRefreshToken(user.id, refreshToken);
                return updatedUser.map((updated) => {
                    const {password: _password, refreshToken: _refreshToken, ...userData} = updated;
                    return { userData, accessToken, refreshToken };
                });
            })
            .mapErr((err) => {
                console.log(`User login failed: ${err}`);
                return err;
            })
            .toPromise();
    };

    async logout(userId: string): Promise<Result<any, string>> {

        return Result.Ok(userId)
            .flatMap( async() => await this.repo.updateRefreshToken(userId, null))
            .mapErr((err) => {
                console.log(`User failed to logout ${err}`)
                return err;
            })
            .toPromise();
    };

    async refreshToken(userId: string, oldRefreshToken: string): Promise<Result<any, string>> {

        return Result.Ok({userId, oldRefreshToken})
            .flatMap(async() => await this.repo.findByIdAndToken(userId, oldRefreshToken))
            .flatMap(async(user) => {
                const newAccessToken = generateAccessToken({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.roleId,
                })
                const newRefreshToken = generateRefreshToken({ id: user.id });

                const updated = await this.repo.updateRefreshToken(user.id, newRefreshToken);
                return updated.map(() => ({accessToken: newAccessToken, refreshToken: newRefreshToken}));
            })
            .mapErr((err) => {
                console.error(`Refresh token flow failed: ${err}`);
                return err;
            })
            .toPromise();
    }
}