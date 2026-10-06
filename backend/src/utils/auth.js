import jwt from "jsonwebtoken";
export const cookieOptions = () => ({httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:process.env.NODE_ENV==="production"?"none":"lax",maxAge:24*60*60*1000,path:"/"});
export const signToken = userId => jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"1d"});
export const setAuthCookie = (res,userId) => res.cookie(process.env.COOKIE_NAME||"brainflow_auth",signToken(userId),cookieOptions());
