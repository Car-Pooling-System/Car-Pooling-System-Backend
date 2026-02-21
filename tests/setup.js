import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/*
Connect DB before tests
*/

beforeAll(async () => {

 await mongoose.connect(process.env.MONGO_URI);

 console.log("✅ Test DB Connected");

});

/*
Close DB after tests
*/

afterAll(async () => {

 await mongoose.connection.close();

 console.log("✅ Test DB Closed");

});