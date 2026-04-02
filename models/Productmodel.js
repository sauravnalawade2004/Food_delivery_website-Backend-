// import mongoose from 'mongoose';

// const ProductSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         Unique: true,
//     },
//     image: {
//         type: String,
//         required: true,
//         Unique: true,
//     },
//     description: {
//         type: String,
//         required: true,
//     },
//     price: {
//         type: Number,
//         required: true,
//     },
//     category: {
//         type: String,
//         required: true
//     }

// }, {timestamps: true});

// export const productModel = mongoose.models.Product ||  mongoose.model("product", ProductSchema);


import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    image: {
        type: String,
        required: true,
        unique: true,
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
    },
    sku: {            // important for ERP tracking
        type: String,
        required: true,
        unique: true
    },
    sellingPrice: {      // what customer pays
        type: Number,
        required: true
    },

    costPrice: {         // used for profit analytics
        type: Number,
        required: true
    },

    currentStock: {      // snapshot only (real truth in ledger)
        type: Number,
        default: 0
    },

    lowStockThreshold: { // alert level
        type: Number,
        default: 10
    },

    unit: {              // pcs / g / kg
        type: String,
        default: "pcs"
    },

    isActive: {          // hide product without deleting
        type: Boolean,
        default: true
    }


}, { timestamps: true });

export const Product = mongoose.models.Product || mongoose.model("product", ProductSchema);
