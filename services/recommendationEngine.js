import orderModel from "../models/ordermodel.js";
import { foodModel } from "../models/Foodmodel.js";

class RecommendationEngine {
    constructor() {
        this.categoryMappings = {
            'Pizza': ['Garlic Bread', 'Soft Drinks', 'Salad', 'Desserts'],
            'Burger': ['Fries', 'Soft Drinks', 'Shake', 'Onion Rings'],
            'Pasta': ['Garlic Bread', 'Salad', 'Soft Drinks', 'Desserts'],
            'Sandwich': ['Fries', 'Soft Drinks', 'Salad', 'Soup'],
            'Salad': ['Soup', 'Soft Drinks', 'Desserts', 'Sandwich'],
            'Desserts': ['Coffee', 'Tea', 'Soft Drinks'],
            'Drinks': ['Burger', 'Pizza', 'Sandwich', 'Fries']
        };
    }

    async getUserRecommendations(userId, limit = 6) {
        try {
            console.log('Getting recommendations for userId:', userId);
            const userOrders = await orderModel.find({ userId }).sort({ date: -1 });
            console.log('Found user orders:', userOrders.length);
            
            if (userOrders.length === 0) {
                console.log('No orders found, returning popular items');
                return await this.getPopularItems(limit);
            }

            console.log('Sample order data:', JSON.stringify(userOrders[0], null, 2));
            const userPreferences = await this.analyzeUserPreferences(userOrders);
            console.log('User preferences:', userPreferences);
            const recommendations = [];

            recommendations.push(...await this.getCategoryBasedRecommendations(userPreferences, limit / 2));
            recommendations.push(...await this.getFrequentlyBoughtTogether(userOrders, limit / 2));

            const finalRecommendations = this.removeDuplicatesAndSort(recommendations, limit);
            console.log('Final recommendations:', finalRecommendations.length);
            return finalRecommendations;
        } catch (error) {
            console.error('Error generating user recommendations:', error);
            return await this.getPopularItems(limit);
        }
    }

    async getFrequentlyBoughtTogether(itemId, limit = 4) {
        try {
            const allOrders = await orderModel.find({});
            const itemFrequency = new Map();

            allOrders.forEach(order => {
                const itemIds = order.items.map(item => item.itemId || item._id);
                
                if (itemIds.includes(itemId)) {
                    itemIds.forEach(id => {
                        if (id !== itemId) {
                            itemFrequency.set(id, (itemFrequency.get(id) || 0) + 1);
                        }
                    });
                }
            });

            const sortedItems = Array.from(itemFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit);

            const recommendations = [];
            for (const [itemId, frequency] of sortedItems) {
                const food = await foodModel.findById(itemId);
                if (food) {
                    recommendations.push({
                        ...food.toObject(),
                        recommendationType: 'frequently_bought_together',
                        score: frequency,
                        reason: `Frequently ordered with this item`
                    });
                }
            }

            return recommendations;
        } catch (error) {
            console.error('Error generating frequently bought together:', error);
            return await this.getCategoryItems(itemId, limit);
        }
    }

    async analyzeUserPreferences(userOrders) {
        console.log('Analyzing preferences for orders:', userOrders.length);
        const categoryCount = new Map();
        const itemFrequency = new Map();

        userOrders.forEach((order, orderIndex) => {
            console.log(`Order ${orderIndex} items:`, order.items);
            order.items.forEach(item => {
                console.log('Processing item:', item);
                const itemId = item.itemId || item._id || item.id;
                console.log('Item ID extracted:', itemId);
                if (itemId) {
                    itemFrequency.set(itemId, (itemFrequency.get(itemId) || 0) + 1);
                }
            });
        });

        console.log('Item frequency map:', Array.from(itemFrequency.entries()));

        for (const [itemId, count] of itemFrequency) {
            try {
                const food = await foodModel.findById(itemId);
                if (food) {
                    categoryCount.set(food.category, (categoryCount.get(food.category) || 0) + count);
                }
            } catch (error) {
                console.error('Error finding food item:', itemId, error);
            }
        }

        const result = {
            favoriteCategories: Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1]),
            favoriteItems: Array.from(itemFrequency.entries()).sort((a, b) => b[1] - a[1])
        };
        console.log('Final user preferences:', result);
        return result;
    }

    async getCategoryBasedRecommendations(userPreferences, limit) {
        const recommendations = [];
        const favoriteCategories = userPreferences.favoriteCategories.slice(0, 3);

        for (const [category, count] of favoriteCategories) {
            const relatedCategories = this.categoryMappings[category] || [];
            
            for (const relatedCategory of relatedCategories) {
                const items = await foodModel.find({ category: relatedCategory }).limit(2);
                items.forEach(item => {
                    recommendations.push({
                        ...item.toObject(),
                        recommendationType: 'category_based',
                        score: count,
                        reason: `Because you like ${category}`
                    });
                });
            }
        }

        return recommendations.slice(0, limit);
    }

    async getFrequentlyBoughtTogether(userOrders, limit) {
        const itemPairs = new Map();

        userOrders.forEach(order => {
            const itemIds = order.items.map(item => item.itemId || item._id);
            
            for (let i = 0; i < itemIds.length; i++) {
                for (let j = i + 1; j < itemIds.length; j++) {
                    const pair = [itemIds[i], itemIds[j]].sort().join('-');
                    itemPairs.set(pair, (itemPairs.get(pair) || 0) + 1);
                }
            }
        });

        const sortedPairs = Array.from(itemPairs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit * 2);

        const recommendations = [];
        const processedItems = new Set();

        for (const [pair, frequency] of sortedPairs) {
            const [item1, item2] = pair.split('-');
            
            if (!processedItems.has(item1) && recommendations.length < limit) {
                const food = await foodModel.findById(item1);
                if (food) {
                    recommendations.push({
                        ...food.toObject(),
                        recommendationType: 'collaborative',
                        score: frequency,
                        reason: 'Customers who bought this also bought'
                    });
                    processedItems.add(item1);
                }
            }
            
            if (!processedItems.has(item2) && recommendations.length < limit) {
                const food = await foodModel.findById(item2);
                if (food) {
                    recommendations.push({
                        ...food.toObject(),
                        recommendationType: 'collaborative',
                        score: frequency,
                        reason: 'Customers who bought this also bought'
                    });
                    processedItems.add(item2);
                }
            }
        }

        return recommendations;
    }

    async getPopularItems(limit = 6) {
        try {
            const allOrders = await orderModel.find({});
            const itemPopularity = new Map();

            allOrders.forEach(order => {
                order.items.forEach(item => {
                    const itemId = item.itemId || item._id;
                    itemPopularity.set(itemId, (itemPopularity.get(itemId) || 0) + 1);
                });
            });

            const sortedItems = Array.from(itemPopularity.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit);

            const recommendations = [];
            for (const [itemId, popularity] of sortedItems) {
                const food = await foodModel.findById(itemId);
                if (food) {
                    recommendations.push({
                        ...food.toObject(),
                        recommendationType: 'popular',
                        score: popularity,
                        reason: 'Popular choice'
                    });
                }
            }

            return recommendations;
        } catch (error) {
            console.error('Error getting popular items:', error);
            return await foodModel.find().limit(limit).map(item => ({
                ...item.toObject(),
                recommendationType: 'popular',
                score: 1,
                reason: 'Popular choice'
            }));
        }
    }

    async getCategoryItems(itemId, limit = 4) {
        try {
            const item = await foodModel.findById(itemId);
            if (!item) return [];

            const categoryItems = await foodModel.find({ 
                category: item.category, 
                _id: { $ne: itemId } 
            }).limit(limit);

            return categoryItems.map(food => ({
                ...food.toObject(),
                recommendationType: 'category_based',
                score: 1,
                reason: `More ${item.category} items`
            }));
        } catch (error) {
            console.error('Error getting category items:', error);
            return [];
        }
    }

    removeDuplicatesAndSort(recommendations, limit) {
        const uniqueItems = new Map();
        
        recommendations.forEach(rec => {
            if (!uniqueItems.has(rec._id)) {
                uniqueItems.set(rec._id, rec);
            } else {
                const existing = uniqueItems.get(rec._id);
                if (rec.score > existing.score) {
                    uniqueItems.set(rec._id, rec);
                }
            }
        });

        return Array.from(uniqueItems.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}

export default new RecommendationEngine();
