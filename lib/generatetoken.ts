import jwt from "jsonwebtoken";

export const generatetoken = (payload: string) => {
    return jwt.sign({ id: payload }, process.env.JWT_SECRET!, { expiresIn: "1d" })
}   