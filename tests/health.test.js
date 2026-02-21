import request from "supertest";
import express from "express";
import healthRouter from "../routes/health.router.js";

const app = express();

app.use("/health", healthRouter);

describe("Health Route Test", () => {

test("GET /health should return server running message", async () => {

const res = await request(app).get("/health");

expect(res.statusCode).toBe(200);

expect(res.body.message)
.toBe("Server is running");

});

});