import express from "express";
import Emission from "../models/carbonEmission.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { type, distances } = req.body;

    const Car = await Emission.findOne({ type: type });
    const emissionFactor = Car.emissionFactor;

    const summationD = distances.reduce((acc, current) => acc + current, 0);

    var emissionArr = [];
    var realEmission = [];
    var totalEmission = 0;
    for (let i = 0; i < distances.length; i++) {
      var emission = (emissionFactor * distances[i]) / 1000;
      emission = Number(emission.toFixed(4));
      emissionArr.push(emission);
      totalEmission += emission;
      var real = emission * (distances[i] / summationD);
      realEmission.push(Number(real.toFixed(4)));
    }
    totalEmission = Number(totalEmission.toFixed(4));

    var emissionCaused = Math.max(...emissionArr);
    emissionCaused = Number(emissionCaused.toFixed(4));
    var savedEmission = totalEmission - emissionCaused;
    savedEmission = Number(savedEmission.toFixed(4));

    res.status(200).json({
      message:
        "Emission per passenger if separate, Total Emission if seperate, Total Emission caused, Emission Saved, Real per capita emission in kilograms",
      body: {
        emissionArr,
        totalEmission,
        emissionCaused,
        savedEmission,
        realEmission,
      },
    });
  } catch (err) {
    res.status(300).json({ message: "Server error", error: err.message });
  }
});

export default router;
