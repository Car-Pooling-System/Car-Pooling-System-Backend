import mongoose from 'mongoose';

// Mock the DB connection to prevent real Atlas connections
jest.mock('../../config/db.js', () => jest.fn());

// Robust mock for Mongoose models to allow integration testing
// while keeping it simple without a real DB.
export const createMockQuery = (resolvedValue = null) => {
    const query = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(resolvedValue),
        then: jest.fn().mockImplementation(function (callback) {
            return Promise.resolve(resolvedValue).then(callback);
        }),
        catch: jest.fn().mockImplementation(function (callback) {
            return Promise.resolve(resolvedValue).catch(callback);
        }),
    };
    return query;
};

export const mockModel = () => {
    return {
        find: jest.fn().mockImplementation(() => createMockQuery([])),
        findOne: jest.fn().mockImplementation(() => createMockQuery(null)),
        findById: jest.fn().mockImplementation(() => createMockQuery(null)),
        create: jest.fn(),
        updateOne: jest.fn().mockResolvedValue({ nModified: 1 }),
        updateMany: jest.fn().mockResolvedValue({ nModified: 1 }),
        findOneAndUpdate: jest.fn().mockImplementation(() => createMockQuery(null)),
        findOneAndDelete: jest.fn().mockImplementation(() => createMockQuery(null)),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };
};
