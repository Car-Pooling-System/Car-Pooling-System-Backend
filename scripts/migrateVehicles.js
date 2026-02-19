import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Driver from '../models/driver.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateVehicles() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all drivers with old vehicle data but empty vehicles array
        const drivers = await Driver.find({
            'vehicle.brand': { $exists: true, $ne: null },
            $or: [
                { vehicles: { $exists: false } },
                { vehicles: { $size: 0 } }
            ]
        });

        console.log(`Found ${drivers.length} drivers to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const driver of drivers) {
            try {
                // Check if vehicle has actual data
                if (driver.vehicle && (driver.vehicle.brand || driver.vehicle.model || driver.vehicle.licensePlate)) {
                    // Initialize vehicles array if it doesn't exist
                    if (!driver.vehicles) {
                        driver.vehicles = [];
                    }

                    // Only migrate if vehicles array is still empty
                    if (driver.vehicles.length === 0) {
                        // Convert old vehicle to plain object and add to vehicles array
                        const vehicleData = {
                            brand: driver.vehicle.brand,
                            model: driver.vehicle.model,
                            year: driver.vehicle.year ? driver.vehicle.year.toString() : '',
                            color: driver.vehicle.color,
                            licensePlate: driver.vehicle.licensePlate,
                            images: driver.vehicle.images || []
                        };

                        driver.vehicles.push(vehicleData);
                        await driver.save();
                        
                        migratedCount++;
                        console.log(`✓ Migrated vehicle for driver: ${driver.userId}`);
                    } else {
                        skippedCount++;
                        console.log(`- Skipped driver ${driver.userId} (already has vehicles)`);
                    }
                } else {
                    skippedCount++;
                    console.log(`- Skipped driver ${driver.userId} (no vehicle data)`);
                }
            } catch (error) {
                console.error(`✗ Error migrating driver ${driver.userId}:`, error.message);
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Successfully migrated: ${migratedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Total processed: ${drivers.length}`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the migration
migrateVehicles();
