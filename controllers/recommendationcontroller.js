import recommendationEngine from "../services/recommendationEngine.js";

const getRecommendationsForUser = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        const limit = parseInt(req.query.limit) || 6;
        const recommendations = await recommendationEngine.getUserRecommendations(userId, limit);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error("Error in getRecommendationsForUser:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate recommendations"
        });
    }
};

const getFrequentlyBoughtTogether = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required"
            });
        }

        const limit = parseInt(req.query.limit) || 4;
        const recommendations = await recommendationEngine.getFrequentlyBoughtTogether(itemId, limit);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error("Error in getFrequentlyBoughtTogether:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate recommendations"
        });
    }
};

const getPopularItems = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const recommendations = await recommendationEngine.getPopularItems(limit);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error("Error in getPopularItems:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get popular items"
        });
    }
};

export {
    getRecommendationsForUser,
    getFrequentlyBoughtTogether,
    getPopularItems
};
