# Car Pooling System — Backend Payment Module Testing Documentation

Author: Mahasri M

---

## 1. Overview

This document provides consolidated testing proof and validation details for the Backend Payment Module of the Car Pooling System. The objective of testing was to verify correct implementation of payment creation, updated money split logic, monthly commission tracking, driver bank validation, duplicate credit prevention, and overall API integration stability.

---

## 2. Testing Environment

Backend Stack:
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

Testing Tools Used:
- Postman
- Swagger API Documentation
- MongoDB Atlas Dashboard

---

## 3. Functional Testing Performed

 3.1 Server Health Verification

Endpoint:
GET /health

Expected Response:

{
  "message": "Server is running"
}
Result: Server connectivity verified successfully.
3.2 Payment Creation Validation
Endpoint: POST /api/payment
Sample Payload:


{
  "rideId": "TEST_RIDE",
  "passengerId": "USER1",
  "driverId": "12345",
  "boardingKm": 5,
  "dropKm": 25,
  "paymentMethod": "upi"
}
Validation Covered:
Required field validation
BoardingKm < DropKm validation
Travel distance calculation
Fare calculation logic
Result: Payment record successfully created. Amount calculated based on distance. Commission computed correctly and stored.
3.3 Updated Money Split Logic Verification
Business Logic Implemented:
Passenger pays full visible ride fare.
Driver receives full payment immediately.
Platform commission is tracked separately.
Commission is accumulated as monthly payable (commissionDue).
Endpoint: PUT /api/payment/{paymentId}/status
Request Body:


{
  "status": "success"
}
Verified:
Driver earnings updated with full payment amount.
commissionDue incremented with platform commission.
Payment marked as credited (isDriverCredited = true).
Payment status updated to success.
Result: Updated money split logic functioning correctly.
3.4 Duplicate Credit Prevention
Logic: Driver credit occurs only when: status === "success" AND isDriverCredited === false
After successful credit: isDriverCredited is set to true.
Test Performed: Payment success API triggered multiple times.
Result: Driver earnings credited only once. Duplicate payout prevented successfully.
3.5 Driver Bank Validation
Endpoint: PUT /api/driver-bank/{userId}
Validation Rules: Driver must have either:
Account Number OR
UPI ID
Test Cases:
Payment attempt without bank details.
Payment after adding valid bank details.
Result: Payment blocked when bank details missing. Payment processed successfully after valid bank details added.
3.6 Passenger Payment History Retrieval
Endpoint: GET /api/payment/passenger/{passengerId}
Verified:
Correct retrieval of payment history.
Records sorted in descending order by creation date.
Result: Passenger payment history functioning correctly.
3.7 Swagger API Documentation Validation
Accessed: http://localhost:3000/api-docs⁠�
Verified:
Payment endpoints documented.
Request and response schemas displayed.
API execution through Swagger successful.
Result: Swagger documentation working correctly.
3.8 Database Verification (MongoDB Atlas)
Verified in database:
Payment records stored correctly.
Driver earnings updated after success status.
commissionDue accumulated accurately.
Payment status updated correctly.
Result: Database consistency confirmed.
4. Integration Flow Testing
Complete Flow Tested: Driver Bank Setup → Payment Creation → Payment Success Update → Driver Earnings Update → Commission Debt Accumulation
Result: End-to-end backend integration validated successfully.
5. Conclusion
The Backend Payment Module has been thoroughly tested for:
Payment lifecycle handling
Updated commission model implementation
Driver payout validation
Monthly commission tracking
Duplicate credit prevention
API stability
Database integrity
All tested scenarios behaved as expected. The system is stable and ready for integration.


