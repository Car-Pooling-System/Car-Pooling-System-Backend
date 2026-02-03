import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from "./config/db.js";

import healthRouter from './routes/health.router.js';

import driverDocsRouter from "./routes/driver/driverDocs.router.js"
import driverRatingRouter from "./routes/driver/driverRating.router.js"
import driverRegisterRouter from "./routes/driver/driverRegistration.router.js"
import driverStatsRouter from "./routes/driver/driverStats.router.js"
import driverVehicleRouter from "./routes/driver/driverVehicle.router.js"
import driverVerificationRouter from "./routes/driver/driverVerification.router.js"
import driverProfileRouter from "./routes/driver/driverProfile.router.js"
import phoneVerificationRouter from "./routes/phoneVerification.router.js"

dotenv.config()
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));


app.use('/health', healthRouter);
app.use('/api/driver-docs', driverDocsRouter);
app.use('/api/driver-profile', driverProfileRouter);
app.use('/api/driver-rating', driverRatingRouter);
app.use('/api/driver-register', driverRegisterRouter);
app.use('/api/driver-stats', driverStatsRouter);
app.use('/api/driver-vehicle', driverVehicleRouter);
app.use('/api/driver-verification', driverVerificationRouter);
app.use('/api/phone-verification', phoneVerificationRouter);

app.listen(PORT, () => {
    console.log(`server is running on http://0.0.0.0:${PORT}`);
})