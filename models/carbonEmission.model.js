import mongoose from "mongoose";

const emissionSchema = new mongoose.Schema({

    type: {
      type: String,
      required: true
    }, 

    emissionFactor: {
      type: Number,
      required: true
    }
});


export default mongoose.model("Emission", emissionSchema);