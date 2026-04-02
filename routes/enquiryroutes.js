import express from 'express';
import { CreateB2bEnquiry, GetAllB2bEnquiry, UpdateB2bEnquiry } from '../controllers/Enquirycontroller.js';
const EnquiryRouter = express.Router();

EnquiryRouter.post('/create', CreateB2bEnquiry);
EnquiryRouter.get('/get', GetAllB2bEnquiry);
EnquiryRouter.put('/update/:id', UpdateB2bEnquiry);

export default EnquiryRouter;