const mongoose=require("mongoose");
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.log(err));
let userSchema=mongoose.Schema({
    username:String,
    email:String,
    password:String,
    profilepic:{
        type:String,
        default:"default.webp"
    },
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"post"
    }]
})
module.exports=mongoose.model("user",userSchema);