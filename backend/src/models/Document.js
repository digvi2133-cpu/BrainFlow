import mongoose from "mongoose";
const schema=new mongoose.Schema({workspace:{type:mongoose.Schema.Types.ObjectId,ref:"Workspace",required:true},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},title:{type:String,default:"Untitled document",trim:true},content:{type:Array,default:[]},yState:{type:String,default:""}},{timestamps:true});
schema.index({workspace:1,updatedAt:-1}); export default mongoose.model("Document",schema);
