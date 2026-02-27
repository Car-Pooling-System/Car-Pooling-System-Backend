import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/*
CONNECT DB BEFORE TESTS
*/

beforeAll(async () => {

 await mongoose.connect(process.env.MONGO_URI, {

   serverSelectionTimeoutMS: 5000

 });

 console.log("✅ Test DB Connected");

});


/*
CLOSE DB AFTER TESTS
*/

afterAll(async () => {

 await mongoose.connection.close();

 console.log("✅ Test DB Closed");

});