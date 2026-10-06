import mongoose from "mongoose";
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},type:{type:String,default:"system"},title:String,message:String,read:{type:Boolean,default:false},metadata:{type:Object,default:{}}},{timestamps:true}); schema.index({user:1,createdAt:-1}); export default mongoose.model("Notification",schema);
