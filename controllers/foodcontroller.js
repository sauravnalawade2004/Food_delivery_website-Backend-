import { foodModel } from "../models/Foodmodel.js";
import fs from 'fs';


// add food item 

const addFoodItem = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image file is required"
            });
        }

        let image_filename = `${req.file.filename}`;

        const food = new foodModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: image_filename
        });

        await food.save();
        res.json({ success: true, message: "Food item added successfully", food});
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Error while adding food item",
            error: error.message
        });
    }
}

//list food iteams

const listFood = async (req, res) => {
    try {
         const foods = await foodModel.find({});
         res.json({
            success: true,
            data: foods
         })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error while listing food items",
            error: error.message
        })
        
    }
}

//remove food item

const removeFood = async (req, res) => {
    try {
         const food = await foodModel.findById(req.body.id);
           fs.unlink(`uploads/${food.image}`, () => {});

           await foodModel.findByIdAndDelete(req.body.id);
              res.json({
                success: true,
                message: "Food item removed successfully"
              })
     } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Error while removing food item",
            error: error.message
        })
        
    }
}


export { addFoodItem, listFood, removeFood };