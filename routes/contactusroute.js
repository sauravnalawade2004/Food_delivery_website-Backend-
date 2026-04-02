import express from 'express';
import { createContactUs, getContactUs } from '../controllers/contactuscontroller.js';

const contactUsRouter = express.Router();


contactUsRouter.post('/create', createContactUs);
contactUsRouter.get('/get', getContactUs);

export default contactUsRouter;