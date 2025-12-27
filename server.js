import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { ConnectDB } from './config/db.js';
import foodRouter from './routes/foodroute.js';
import userRouter from './routes/userroute.js';
import cartRouter from './routes/cartroute.js';
import orderRouter from './routes/orderroute.js';
import recommendationRouter from './routes/recommendationroute.js';


//app config
const app =express();
const port = Number(process.env.PORT) || 3000;


//middlewares
app.use(express.json());
app.use(cors());


//DB config
ConnectDB();

//api routes
app.use('/app/food', foodRouter)
app.use('/images', express.static('uploads'))
app.use('/app/user', userRouter);
app.use('/app/cart', cartRouter)
app.use('/app/order', orderRouter)
app.use('/app/recommendations', recommendationRouter)


app.get('/', (req, res) => {
  res.send('Hello World!');
});



const server = app.listen(port, () => {
    console.log(`server listening on port ${port}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
    }
});