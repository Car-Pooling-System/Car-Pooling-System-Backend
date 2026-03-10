import express from "express";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";

import healthRouter from "./routes/health.router.js";
import phoneVerificationRouter from "./routes/phoneVerification.router.js";

import driverRouter from "./routes/driver/index.js";
import rideRouter from "./routes/rides/index.js";
import riderRouter from "./routes/rider/index.js";
import emissionRouter from "./routes/carbon.router.js";

import paymentRouter from "./routes/payment/payment.router.js";
import mlRouter from "./routes/ml.router.js";
import chatRouter from "./routes/chat.router.js";
import registerChatSocket from "./socket/chat.socket.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send(
    '<h1>Car Pooling System API</h1><p>The server is running. Try <a href="/health">/health</a> for status.</p>',
  );
});

app.use("/health", healthRouter);
app.use("/api/ml", mlRouter); // Moved up for priority
console.log("ML Proxy Router Registered at /api/ml");
app.use("/api/phone-verification", phoneVerificationRouter);

app.use("/api", driverRouter);
app.use("/api/rides", rideRouter);
app.use("/api/rider", riderRouter);

app.use("/get-emission", emissionRouter);

app.use("/api/payment", paymentRouter);

app.use("/api/chat", chatRouter);

if (process.env.NODE_ENV !== "test") {
  const httpServer = createServer(app);
  const io = new SocketIO(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  registerChatSocket(io);

  const startServer = (port) => {
    httpServer
      .listen(port, () => {
        console.log(`server is running on http://0.0.0.0:${port}`);
      })
      .on("error", (e) => {
        if (e.code === "EADDRINUSE") {
          console.warn(`Port ${port} is already in use. Trying port ${port + 1}...`);
          startServer(port + 1);
        } else {
          console.error("Server error:", e);
        }
      });
  };

  startServer(PORT);
}

export default app;
