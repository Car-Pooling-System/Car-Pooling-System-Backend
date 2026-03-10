import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import healthRouter from "./routes/health.router.js";
import phoneVerificationRouter from "./routes/phoneVerification.router.js";

import driverRouter from "./routes/driver/index.js";
import driverBankRouter from "./routes/driver/driverBank.router.js";

import rideRouter from "./routes/rides/index.js";
import riderRouter from "./routes/rider/index.js";

import emissionRouter from "./routes/carbon.router.js";
import paymentRouter from "./routes/payment/payment.router.js";

/* Razorpay Routes */
import razorpayRouter from "./routes/payment/razorpay.router.js";
import razorpayVerifyRouter from "./routes/payment/razorpayVerify.router.js";
import commissionRouter from "./routes/payment/commission.router.js";

dotenv.config();

const app = express();

/*
====================
MIDDLEWARE
====================
*/

app.use(express.json());

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

/*
====================
ROUTES
====================
*/

app.use("/health", healthRouter);

app.use("/api/phone-verification", phoneVerificationRouter);

app.use("/api", driverRouter);

app.use("/api/driver-bank", driverBankRouter);

app.use("/api/rides", rideRouter);

app.use("/api/rider", riderRouter);

app.use("/get-emission", emissionRouter);

app.use("/api/payment", paymentRouter);

/* Razorpay Payment Gateway */
app.use("/api/razorpay", razorpayRouter);

/* Razorpay Payment Verification */
app.use("/api/razorpay", razorpayVerifyRouter);

app.use("/api/payment", commissionRouter);

/*
====================
SWAGGER DOCS
====================
*/

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/*
====================
SERVER START
====================
*/

if (process.env.NODE_ENV !== "test") {
  connectDB();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;