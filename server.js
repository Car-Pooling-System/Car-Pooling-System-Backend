import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from "./config/db.js";

import healthRouter from './routes/health.router.js';

dotenv.config()
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

app.use('/health', healthRouter);

app.listen(PORT, () => {
    console.log(`server is running on http://0.0.0.0:${PORT}`);
})