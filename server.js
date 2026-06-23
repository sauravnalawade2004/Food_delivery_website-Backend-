import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { ConnectDB } from './config/db.js';
import productRouter from './routes/productroute.js';
import userRouter from './routes/userroute.js';
import cartRouter from './routes/cartroute.js';
import orderRouter from './routes/orderroute.js';
import recommendationRouter from './routes/recommendationroute.js';
<<<<<<< HEAD
import contactUsRouter from './routes/contactusroute.js';
import EnquiryRouter from './routes/enquiryroutes.js';
import apiProductsRouter from './routes/apiproducts.js';
import adminAuthRouter from './routes/adminauthroute.js';
=======
>>>>>>> 3dce99f7010f1c2f764e23c863c382796b0a25a6


//app config
const app = express();
const port = Number(process.env.PORT) || 3000;


//middlewares
app.use(express.json());
app.use(cors());


//DB config
ConnectDB()


//api routes
// Admin authentication routes
app.use('/admin/auth', adminAuthRouter)

app.use('/app/food', productRouter)
app.use('/images', express.static('uploads'))
app.use('/app/user', userRouter);
app.use('/app/cart', cartRouter)
app.use('/app/order', orderRouter)
app.use('/app/recommendations', recommendationRouter)
<<<<<<< HEAD
app.use('/app/contactus', contactUsRouter);
app.use('/app/enquiry', EnquiryRouter)


app.use('/api/products', apiProductsRouter);

=======
>>>>>>> 3dce99f7010f1c2f764e23c863c382796b0a25a6


app.get('/', (req, res) => {
    res.send('Hello World!');
});



const server = app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});



