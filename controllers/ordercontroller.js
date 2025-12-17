
import dotenv from "dotenv";
dotenv.config(); 
import orderModel from "../models/ordermodel.js";
import userModel from "../models/Usermodel.js";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

console.log("stripe key in controller:", process.env.STRIPE_SECRET_KEY);

//placing user order from frontend

const placeOrder = async (req,res) => {

    const frontend_url = "http://localhost:5173";
    
    console.log("ORDER BODY:", req.body);

   try {
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
        return res.json({success: false, message: "No items provided for order"});
    }
    const newOrder = new orderModel({
        userId: req.userId,
        items: req.body.items, // correct field name
        amount: req.body.amount,
        address: req.body.address
    })
    await newOrder.save();
    await userModel.findByIdAndUpdate(req.userId,{cartData:{}});
    
    const line_items = req.body.items.map((item) => ({
         price_data: {
            currency:"inr",
            product_data:{
                name:item.name
            },
            unit_amount: item.price*100
         },
         quantity:item.quantity
    }))

    line_items.push({
        price_data:{
            currency: "inr",
            product_data:{
                name: "Delivery Charges"
            },
            unit_amount: 2*100*88
        },
        quantity: 1
    });

    const session = await stripe.checkout.sessions.create({
        line_items:line_items,
        mode:'payment',
        success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    })

    res.json({success:true,session_url:session.url})

   } catch (error) {
     console.log("PLACE ORDER ERROR:", error);
     res.json({
        success: false,
        message: error.message || "Error placing order"
     })
   }
}

const verifyOrder = async (req,res) => {
    const {orderId, success} = req.body;
    try {
        if (success=="true") {
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({
                success: true,
                message: "Paid"
            })
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({
                success: false,
                message: "Not Paid"
            })
        }
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
        
    }
}   

//user order from frontend 
const userOrder = async(req,res) => {
    try {
        const orders = await orderModel.find({userId:req.userId});
        res.json({success: true,data:orders })
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

//Listing order for Admin
const listOrders = async (req,res) => {
     try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
     } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error"
        })
        
     }
}

// api for upadating order status 
const updateSatus = async(req,res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true,message:"updated"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
        
    }
}

export { placeOrder, verifyOrder, userOrder,listOrders,updateSatus};