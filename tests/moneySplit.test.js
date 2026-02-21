import request from "supertest";
import app from "../server.js";

describe("Money Split Logic Test", () => {

let paymentId;

test("Passenger Travels Partial Distance", async ()=>{

const createPayment = await request(app)

.post("/api/payment")

.send({

rideId:"RIDEMONEY1",
passengerId:"USER999",
driverId:"12345",

boardingKm:10,
dropKm:50,

paymentMethod:"upi"

});

expect(createPayment.statusCode).toBe(201);

paymentId = createPayment.body.payment._id;

});


test("Money Split Success Update", async ()=>{

const updatePayment = await request(app)

.put(`/api/payment/${paymentId}/status`)

.send({

status:"success",
transactionId:"TXNMONEY999",

boardingKm:10,
dropKm:50,
travelDistanceKm:40

});

expect(updatePayment.statusCode).toBe(200);

expect(updatePayment.body.payment.status)

.toBe("success");

});

});