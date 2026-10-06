import Activity from "../models/Activity.js"; import Notification from "../models/Notification.js";
export const logActivity=async(data)=>{try{return await Activity.create(data);}catch(e){console.error("Activity log:",e.message);}};
export const notify=async(io,userId,data)=>{const n=await Notification.create({user:userId,...data}); io?.to(`user:${userId}`).emit("notification:new",n); return n;};
