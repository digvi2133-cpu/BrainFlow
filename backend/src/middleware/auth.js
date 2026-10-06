import jwt from "jsonwebtoken";
export const protect = (req,res,next) => {
  try {
    const token=req.cookies?.[process.env.COOKIE_NAME||"brainflow_auth"];
    if(!token) return res.status(401).json({success:false,message:"Authentication required."});
    req.user=jwt.verify(token,process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({success:false,message:"Invalid or expired session."}); }
};
