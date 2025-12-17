import mongoose from 'mongoose';

const FoodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        Unique: true,
    },
    image: {
        type: String,
        required: true,
        Unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true
    }

}, {timestamps: true});

export const foodModel = mongoose.models.Food ||  mongoose.model("food", FoodSchema);