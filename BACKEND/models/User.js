const mongoose=require("mongoose");

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },

        email:{
            type:String,
            required:true,
            trim:true,
            unique:true,
            lowercase:true
        },

        password:{
           type:String,
            required:true
        },

        phone:{
            type:String,
            required:true
        },

        address:{
            type:String,
            required:true
        },
        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer"
        }
    },
    {
        timestamps:true
    }
)
module.exports=mongoose.model("User",userSchema);