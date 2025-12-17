import express from 'express';
import { addFoodItem, listFood, removeFood } from '../controllers/foodcontroller.js';
import multer from 'multer';


const foodRouter = express.Router();

// foodRouter.post('/add', addFoodItem);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null,`${ Date.now()} ${file.originalname}`)
       
    }
})
const uploade = multer({
    storage: storage
})


foodRouter.post('/add', uploade.single("image"),addFoodItem);
foodRouter.get('/list',listFood);
foodRouter.post('/remove', removeFood);

export default foodRouter;