import mongoose from "mongoose";
const schema=new mongoose.Schema({workspace:{type:mongoose.Schema.Types.ObjectId,ref:"Workspace",required:true},user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},role:{type:String,enum:["owner","admin","editor","viewer"],default:"editor"}},{timestamps:true});
schema.index({workspace:1,user:1},{unique:true}); export default mongoose.model("Membership",schema);
