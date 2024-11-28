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

app.get('/user',async (req,res) =>  {
    const span = trace.getTracer('user-service').startSpan('getUser');
    console.log('Span started');
    try{
        const users = await User.findAll();
        res.json(users);
        console.log('Users fetched:',users);
    }catch(err){
        span.recordException(err);
        console.error('Error occurred:', err);
        res.status(500).json({error: 'Internal Server Error'});
    }finally{
        span.end();
        console.log('Span ended');
    }
    console.log('Span details:', span);
})

app.post('/user',async(req,res) =>{
    const span = trace.getTracer('user-service').startSpan('createUser');
    try{
        const {name,email} = req.body;
        span.setAttributes({name,email});
        const newUser = await User.create({name,email});
        res.status(201).json(newUser);
    }catch(err){
        span.recordException(err);
        res.status(500).json({error: 'Internal Server Error'});
    }finally{
        span.end()
    }
    console.log('Span details:', span);
})


const startServer = async () =>{
   console.log('Application is starting...');
   try{
    await sequelize.sync({force: true});
    app.listen(port,() =>{
        console.log(`Server is running on port ${port}`);
    })
   }catch(err){
    console.error('Error starting server',err);
   }
}

startServer();