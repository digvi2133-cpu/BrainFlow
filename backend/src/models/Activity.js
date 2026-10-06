import mongoose from "mongoose";
const schema=new mongoose.Schema({workspace:{type:mongoose.Schema.Types.ObjectId,ref:"Workspace"},user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},action:String,entityType:String,entityId:String,metadata:{type:Object,default:{}}},{timestamps:true}); export default mongoose.model("Activity",schema);
