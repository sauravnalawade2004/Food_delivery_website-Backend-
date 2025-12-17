import mongoose from 'mongoose';

export const ConnectDB = async () => {
    try{
       await mongoose.connect('mongodb+srv://sauravnalawade143_db_user:k1aZ70ECIU07BmXS@cluster0.ghw0d4n.mongodb.net/appName=Cluster0;')
        console.log("MongoDB connected");
    }catch(err){
        console.log("MongoDB connection failed", err);
    }
}