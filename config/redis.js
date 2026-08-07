import redis from "redis"

const connection = redis.createClient({
    
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})