import jwt from "jsonwebtoken";
import { UserType } from '../types/index.js';

const jwtKey = 'chrysaule';

export const setTokenUser = (dataUser:UserType) => {
    const token = jwt.sign(
        dataUser,
        jwtKey,
        {expiresIn: "2h"}
    );

    return token
}

export const readTokenUser = (token: string) => {
    try {
        var decoded = jwt.verify(token, jwtKey);
        return decoded;
    } catch (e) {
        const { name, message } = e;
        return {
            id: 0,
            email: "",
            role: "",
            error : (name === "TokenExpiredError") ? 'Your session expired. Sign in again.': message
        };
    }
}