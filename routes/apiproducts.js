import express from 'express';
import { Product } from '../models/Productmodel.js';

const router = express.Router();

// ─── Get All Products (Public API with Filters) ────────────────────────────────
// Used by frontend for product listing page
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            masalaType, // Support both 'category' and 'masalaType' from frontend
            search,
            weight,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const query = { isActive: true }; // Only show active products

        // Use masalaType if provided, otherwise use category
        const categoryFilter = masalaType || category;

        // Search by name or description
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        // Filter by category/masalaType
        if (categoryFilter) {
            if (Array.isArray(categoryFilter)) {
                query.category = { $in: categoryFilter };
            } else {
                query.category = categoryFilter;
            }
        }

        // Filter by weight
        if (weight) {
            if (Array.isArray(weight)) {
                query.weight = { $in: weight };
            } else {
                query.weight = weight;
            }
        }

        const skip = (Number(page) - 1) * Number(limit);
        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

        const [products, total] = await Promise.all([
            Product.find(query)
                .select('name description category sellingPrice costPrice sku unit image currentStock weight')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            Product.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            products,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
