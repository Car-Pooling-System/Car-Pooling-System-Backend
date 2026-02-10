import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from "./config/db.js";

import healthRouter from './routes/health.router.js';
import phoneVerificationRouter from './routes/phoneVerification.router.js'

import driverRouter from "./routes/driver/index.js";
import rideRouter from "./routes/rides/index.js";
import riderRouter from "./routes/rider/index.js";

import emissionRouter from './routes/carbon.router.js';

import seedData from './models/addEmission.js';

dotenv.config()
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

seedData();


app.use('/health', healthRouter);
app.use('/api/phone-verification', phoneVerificationRouter);

app.use('/api', driverRouter);
app.use("/api/rides", rideRouter);
app.use("/api/rider", riderRouter);

app.use("/get-emission", emissionRouter);

app.listen(PORT, () => {
    console.log(`server is running on http://0.0.0.0:${PORT}`);
})