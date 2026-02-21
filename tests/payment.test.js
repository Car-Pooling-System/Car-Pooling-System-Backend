import request from "supertest";
import mongoose from "mongoose";
import app from "../server.js";

describe("Payment API Unit Tests", () => {

  test("Create Payment", async () => {

    const response = await request(app)
      .post("/api/payment")
      .send({

        rideId: "TEST_RIDE_1",
        passengerId: "TEST_PASSENGER",
        driverId: "12345",
        boardingKm: 5,
        dropKm: 25,
        paymentMethod: "upi"

      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty("payment");

  });

});