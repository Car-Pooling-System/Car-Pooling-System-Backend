import express from 'express';
import axios from 'axios';

const router = express.Router();

// Base URL for the Flask ML service
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * @route   POST /api/ml/predict-demand
 * @desc    Get demand prediction from ML service
 */
router.post('/predict-demand', async (req, res) => {
    try {
        console.log('--- ML Demand Prediction Request ---');
        console.log('Payload:', req.body);

        const response = await axios.post(`${ML_SERVICE_URL}/predict-demand`, req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error calling ML service (predict-demand):', error.message);

        if (error.response) {
            // Forward the error from Flask if available
            return res.status(error.response.status).json(error.response.data);
        }

        res.status(500).json({
            error: "ML service unavailable",
            message: error.message
        });
    }
});

/**
 * @route   GET /api/ml/demand-heatmap
 * @desc    Get demand heatmap from ML service
 */
router.get('/demand-heatmap', async (req, res) => {
    try {
        console.log('--- ML Demand Heatmap Request ---');

        const response = await axios.get(`${ML_SERVICE_URL}/demand-heatmap`);

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error calling ML service (demand-heatmap):', error.message);

        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }

        res.status(500).json({
            error: "ML service unavailable",
            message: error.message
        });
    }
});

export default router;
