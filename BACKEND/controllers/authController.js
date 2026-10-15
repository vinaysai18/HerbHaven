const User=require("../models/User");
const bcrypt=require("bcryptjs");
const jwt = require("jsonwebtoken");    

const registerUser= async (req,res)=>{
    try{
        const {name,email,password,phone,address}=req.body;

        const existingUser=await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            });
        }

        const hashPassword=await bcrypt.hash(password,10);
        const user=await User.create({
            name,
            email,
            password:hashPassword,
            phone,
            address
        });

        res.status(201).json({
            message:"User registered successfully",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address
            }
        });
    }catch(error){
        res.status(500).json({
            message:"Registration failed",
            error:error.message
        });
    }
};

const loginUser=async (req,res)=>{
    try{
        const {email,password}=req.body;
        
        if(!email || !password){
            return res.status(400).json({
                message:"email and password are required"
            })
        }

        const user=await User.findOne({email});
        if(!user){
            return res.status(401).json({
                message:"Invalid email or password!"
            });
        }

        const isPasswordCorrect=await bcrypt.compare(
            password,
            user.password
        );

        if(!isPasswordCorrect){
            return res.status(401).json({
                message:"Incorrect Password!",
            })
        }

        const token=jwt.sign(
            {
                id:user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {expiresIn:"1d"}
        );

        res.status(200).json({
            message:"Login Successfull",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role: user.role
            }
        });
    }catch(error){
        res.status(500).json({
            message:"Login failed!",
            error:error.message
        });
    }
};


module.exports = {
    registerUser,
    loginUser
};