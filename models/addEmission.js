import Emission from "./carbonEmission.model.js";

const seedData = async () => {
    try {
        const data = [
            { type: "hatchback petrol", emissionFactor: 117 }, 
            { type: "premium hatchback petrol", emissionFactor: 150 }, 
            { type: "hatchback diesel", emissionFactor: 105 }, 
            { type: "premium hatchback diesel", emissionFactor: 136 }, 
            { type: "sedan petrol", emissionFactor: 150 }, 
            { type: "premium sedan petrol", emissionFactor: 210 }, 
            { type: "sedan diesel", emissionFactor: 132 }, 
            { type: "premium sedan diesel", emissionFactor: 170 }, 
            { type: "suv diesel", emissionFactor: 196 }, 
            { type: "premium suv diesel", emissionFactor: 220 }, 
            { type: "muv diesel", emissionFactor: 174 }, 
            { type: "hybrid petrol", emissionFactor: 95 }
        ];

        const result = await Emission.insertMany(data);
        if (result){
            console.log("Data inserted");
        }
    } catch (err) {
        console.error(err);
    }
};

export default seedData;