import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'

import healthRouter from './routes/health.router.js';

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

app.use('/health', healthRouter);

app.listen(PORT, () => {
    console.log("server is running on http://0.0.0.0:" + PORT);
})