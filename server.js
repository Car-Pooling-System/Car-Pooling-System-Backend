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

// Emission Route
import emissionRouter from './routes/carbon.router.js';

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

// Emission Route
app.use('/api/get-emission', emissionRouter);


app.listen(PORT, () => {
    console.log(`server is running on http://0.0.0.0:${PORT}`);
})

// Remove after adding
/*
import Emission from './models/carbonEmission.model.js';

const seedData = async () => {
    try {
      const data = [
        { type: "hatchback petrol", emissionFactor: 117 }, 
        { type: "premium hatchback petrol", emissionFactor: 150 }, 
        { type: "hatchback diesel", emissionFactor: 105 }, 
        { type: "premium hatchback diesel", emissionFactor: 136 }, 
        { type: "sedan petrol", emissionFactor: 150 }, 
        { type: "premium sedan petrol", emissionFactor: 210 }, 
        { type: "sedan diesel", emissionFactor: 132 }, 
        { type: "premium sedan diesel", emissionFactor: 170 }, 
        { type: "suv diesel", emissionFactor: 196 }, 
        { type: "premium suv diesel", emissionFactor: 220 }, 
        { type: "muv diesel", emissionFactor: 174 }, 
        { type: "hybrid petrol", emissionFactor: 95 }, 
        { type: "electric", emissionFactor: 0 }
      ];
  
      const result = await Emission.insertMany(data);
      console.log("Data inserted");
    } catch (err) {
      console.error(err);
    }
};

seedData();
*/
