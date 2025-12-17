import express from "express";
import { LoginUser, SignUp } from "../controllers/usercontroller.js";


const userRouter = express.Router()

userRouter.post("/signup", SignUp)
userRouter.post("/login", LoginUser)

export default userRouter;