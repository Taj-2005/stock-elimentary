import jwt from "jsonwebtoken";

export function signJWT(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }
}