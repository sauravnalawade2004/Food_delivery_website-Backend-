import express from 'express';
import { getRecommendationsForUser, getFrequentlyBoughtTogether, getPopularItems } from '../controllers/recommendationcontroller.js';
import authMiddleware from '../middleware/auth.js';

const recommendationRouter = express.Router();

recommendationRouter.get('/user', authMiddleware, getRecommendationsForUser);
recommendationRouter.get('/popular', getPopularItems);
recommendationRouter.get('/frequently-bought-together/:itemId', getFrequentlyBoughtTogether);

export default recommendationRouter;
