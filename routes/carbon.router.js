import express from 'express';
import Emission from '../models/carbonEmission.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try{
        const { type, distances } = req.body;

        const Car = await Emission.findOne({ type: type });
        const emissionFactor = Car.emissionFactor;

        const driverDist = Math.max(distances);

        const emissionArr = [];
        var totalEmission = 0;
        var driverEmission = 0;
        for (let i = 0; i < distances.length; i++){
            if (distances[i] === driverDist){
                var emission = emissionFactor * distances[i];
                emissionArr.push(emission);
                driverEmission += emission;
                totalEmission += emission;
            } else {
                var emission = emissionFactor * distances[i];
                emissionArr.push(emission);
                totalEmission += emission;
            }
        }

        const savedEmission = totalEmission - driverEmission;
        
        res.status(200).json({message: `Emission in grams is: ${emissionArr}\nEmission if seperate: ${totalEmission}\nEmission saved: ${savedEmission}`});
    } catch (err){
        res.status(300).json({ message: "Server error", error: err.message });
    }
});

export default router;