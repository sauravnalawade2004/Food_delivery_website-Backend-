import userModel from "../models/Usermodel.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// login user
const LoginUser = async(req, res) => {
     const {email, password} = req.body;
     try {
        const user = await userModel.findOne({email})

        if(!user){
           res.json({
            success: false,
            message: "User not found"
            })
        }

       const isMatch = await bcrypt.compare(password, user.password);
         if(!isMatch){
           return res.json({
                success: false,
                message: "Invalid credentials"
            })
         }

         const token = createToken(user._id);
            res.json({
            success: true,
            message: "User logged in successfully",
            token: token
            })
     } catch (error) {
        console.log("Error in login controller", error);
        res.json({
            success: false,
            message: "Error in login controller"
        })
        
     }
}


const createToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return JWT.sign({id}, process.env.JWT_SECRET);
}

// Sign up user 
const SignUp = async(req, res) => {
    
    const {name, password, email} = req.body;
    try {
        // Check if user already exists
        const exists = await userModel.findOne({email});
        if(exists) {
            return res.json({
                success: false,
                message:"User already exists"
            })
        }

        // Validating email format and strong password
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Please enter a valid email"
            })
        }

        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Please enter a strong password"
            })
        }

        // Hashing user password 
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating new user
        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword
        })

        const user = await newUser.save()
        const token = createToken(user._id);
        
        res.json({
            success: true,
            message: "User registered successfully",
            data: user,
            token: token
        })

    } catch (error) {
        console.log("Error in signup controller", error);
        res.json({
            success: false,
            message: "Error in signup controller"
        })
    }
}
 




export { LoginUser, SignUp};
