import './tracing.js'
import express from 'express';
import sequelize from './config/database.js';
import redisClient from './config/redis.js';
import User from './models/User.js';
import { trace } from '@opentelemetry/api';

const port = 6000;

const app = express()
app.use(express.json());

//Middleware for cash response
const cache = async (req,res,next) =>{
    const {username} = req.params;
    try{
        const data = await redisClient.get(username)
        if(data){
            return res.json(JSON.parse(data))
        }else{
            next();
        }
    }catch(err){
        next(err);
    }
}

//Invalidate cache middleware
const invalidateCache = async (req,res,next) =>{
    const {username} = req.params;
    try{
        if(username){
            await redisClient.del(username)
        }
        next()
    }catch(err){
        next(err);
        console.log('Redis Error',err);
    }
}

//routes
app.get('/',(req,res) =>{
    res.json({message: 'Hello World'})
})


app.listen(port,() =>{
    console.log(`Server is running on port ${port}`);
})