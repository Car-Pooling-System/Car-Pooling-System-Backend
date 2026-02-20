# Car Pooling System - Backend

A robust and scalable Node.js backend for a ride-sharing application that connects drivers and riders efficiently using geospatial search, real-time ride management, and secure payment integration.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Key Features](#key-features)
- [Running the Server](#running-the-server)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Functionality
- **Driver Management**: Registration, profile management, document verification
- **Ride Management**: Create, search, book, cancel, and edit rides
- **Passenger Management**: Book rides, track trips, cancel bookings
- **Geospatial Search**: Grid-based ride search for optimal performance
- **Rating & Reviews**: Driver and rider rating systems
- **Phone Verification**: OTP-based verification using Twilio
- **Pricing System**: Dynamic fare calculation based on distance
- **Preferences**: Customizable ride preferences (smoking, pets, capacity)
- **Statistics**: Driver and rider statistics tracking
- **Real-time Coordination**: Efficient route planning and passenger management

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Clerk (Frontend integrated) |
| **SMS/OTP** | Twilio |
| **Geolocation** | Haversine Distance, Google Maps API |
| **File Storage** | Firebase Storage (via frontend) |
| **CORS** | Express CORS |
| **Environment** | dotenv |

---

## Project Structure

```
Car-Pooling-System-Backend/
├── config/
│   ├── db.js                    # MongoDB connection configuration
│   └── firebase-key.json        # Firebase credentials
│
├── models/
│   ├── user.model.js            # Rider schema
│   ├── driver.model.js          # Driver schema
│   ├── ride.model.js            # Ride schema
│   └── rideInstance.model.js    # Recurring ride instances
│
├── routes/
│   ├── driver/
│   │   ├── driverRegistration.router.js
│   │   ├── driverProfile.router.js
│   │   ├── driverVehicle.router.js
│   │   ├── driverDocs.router.js
│   │   ├── driverVerification.router.js
│   │   ├── driverRating.router.js
│   │   ├── driverStats.router.js
│   │   ├── driverRides.router.js
│   │   └── index.js
│   │
│   ├── rider/
│   │   ├── rider.rides.router.js
│   │   └── index.js
│   │
│   ├── rides/
│   │   ├── ride.create.router.js
│   │   ├── ride.search.router.js
│   │   ├── ride.book.router.js
│   │   ├── ride.cancel.router.js
│   │   ├── ride.details.router.js
│   │   ├── ride.driver.router.js
│   │   ├── ride.remove-passenger.router.js
│   │   └── index.js
│   │
│   ├── phoneVerification.router.js
│   ├── health.router.js
│   └── upload.router.js
│
├── utils/
│   ├── geo.utils.js             # Geospatial grid functions
│   ├── fare.utils.js            # Fare calculation
│   ├── polyline.utils.js        # Polyline encoding/decoding
│   ├── route.utils.js           # Route utilities
│   └── recurrence.utils.js      # Recurring ride logic
│
├── server.js                    # Express app setup
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **Twilio Account** (for SMS OTP)
- **Google Maps API Key** (for route planning)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/car-pooling-system-backend.git
cd car-pooling-system-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

### Step 4: Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```


### Step 5: Run the Server
```bash
node server.js
```

The server will start on `http://localhost:3000`

### Step 6: Run with Docker (Optional)
Warning: Ensure you have Docker and Docker Compose installed.

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
2.  **Access the App**:
    The server will be available at `http://localhost:3000`.
3.  **Stop Containers**:
    ```bash
    docker-compose down
    ```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/carpooling
# Or use MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/carpooling

# Twilio Configuration (for SMS OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_VERIFY_SID=your_verify_service_id

# Frontend CORS
FRONTEND_URL=http://localhost:5173

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### How to Get Credentials:

**MongoDB Atlas:**
1. Visit [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string

**Twilio:**
1. Sign up at [twilio.com](https://www.twilio.com)
2. Create a Verify Service
3. Copy Account SID, Auth Token, and Service SID

**Google Maps API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create an API key

---

## Database Models

### 1. **Driver Model**
```javascript
{
  userId: String (unique, indexed),
  profileImage: String,
  phoneNumber: String,
  vehicle: {
    brand, model, year, color, licensePlate,
    images: [String]
  },
  documents: {
    drivingLicense, vehicleRegistration, insurance
  },
  rating: { average, reviewsCount },
  rides: { hosted, completed, cancelled },
  hoursDriven: Number,
  distanceDrivenKm: Number,
  earnings: { total },
  verification: { emailVerified, phoneVerified, drivingLicenseVerified, vehicleVerified },
  trustScore: Number,
  isBlocked: Boolean
}
```

### 2. **Rider Model**
```javascript
{
  userId: String (unique, indexed),
  documents: [String],
  rating: { average, reviewsCount },
  bookings: [{
    rideId, pickupGrid, dropGrid, farePaid, status
  }],
  rides: { completed, cancelled },
  hoursTravelled: Number,
  distanceTravelledKm: Number,
  verification: { emailVerified, phoneVerified, idVerified },
  trustScore: Number,
  isBlocked: Boolean
}
```

### 3. **Ride Model**
```javascript
{
  driver: { userId, name, profileImage, rating },
  route: {
    start: { name, location (GeoJSON), grid },
    end: { name, location (GeoJSON), grid },
    stops: [{ name, location, grid, pickupAllowed }],
    encodedPolyline: String,
    gridsCovered: [String] (indexed for search)
  },
  schedule: {
    departureTime: Date,
    recurrence: { type, daysOfWeek, endDate }
  },
  seats: { total, available, front, back },
  pricing: { baseFare, currency, pricePerKm },
  preferences: { smokingAllowed, petsAllowed, max2Allowed },
  passengers: [{
    userId, name, profileImage, pickupGrid, dropGrid, farePaid, status
  }],
  status: String (enum: scheduled, ongoing, completed, cancelled),
  metrics: { totalDistanceKm, durationMinutes }
}
```

### 4. **RideInstance Model**
```javascript
{
  parentRideId: ObjectId (ref: Ride),
  rideDate: Date (indexed),
  status: String (enum: scheduled, completed, cancelled)
}
```

---

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health status |

### Phone Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/phone-verification/send-otp` | Send OTP to phone number |
| `POST` | `/api/phone-verification/verify-otp` | Verify OTP code |

### Driver Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/driver-register/:userId` | Register driver |
| `GET` | `/api/driver-register/:userId` | Get driver details |
| `GET` | `/api/driver-rides/:userId` | Get driver's rides |
| `POST` | `/api/driver-vehicle/:userId` | Add/Update vehicle info |
| `PUT` | `/api/driver-docs/:userId` | Upload documents |
| `PUT` | `/api/driver-profile/:userId/phone` | Update phone number |
| `PUT` | `/api/driver-profile/:userId/image` | Update profile image |
| `GET` | `/api/driver-stats/:userId` | Get driver statistics |
| `GET` | `/api/driver-rating/:userId` | Get driver ratings |

### Ride Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rides` | Create new ride |
| `GET` | `/api/rides/:rideId` | Get ride details |
| `PUT` | `/api/rides/:rideId` | Update ride (edit) |
| `DELETE` | `/api/rides/:rideId` | Cancel ride |
| `GET` | `/api/rides/search?grids=...` | Search rides by grid |
| `POST` | `/api/rides/:rideId/book` | Book a ride |
| `POST` | `/api/rides/:rideId/remove-passenger` | Remove passenger |

### Rider Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rider/:userId/rides` | Get rider's bookings |

---

## Key Features in Detail

### 1. **Geospatial Grid Search**
- Uses grid-based indexing (configurable grid size: 0.05° ≈ 5km)
- Efficient search using `gridsCovered` index
- Fast ride discovery without expensive distance calculations

### 2. **Ride Creation with Route Optimization**
- Google Maps integration for route planning
- Polyline encoding for compact route storage
- Automatic grid calculation for search
- Support for recurrence patterns (one-time, daily, weekly, etc.)

### 3. **Dynamic Fare Calculation**
```
Total Fare = Base Fare + (Distance × Price Per Km)
```

### 4. **OTP Verification**
- Twilio SMS integration
- Mock OTP support for development (code: `123456`)
- Fallback to mock if Twilio not configured

### 5. **Rider Booking Flow**
1. Search rides by geospatial grid
2. View ride details
3. Book seat with pickup/drop grid
4. Fare calculation and confirmation
5. Driver can approve/reject
6. Ride tracking

### 6. **Driver Management**
- Registration with vehicle details
- Document upload (License, Registration, Insurance)
- Verification workflow
- Rating and review system
- Statistics tracking

---

## Running the Server

### Development Mode
```bash
node server.js
```

### Production Mode (Recommended)
```bash
npm install pm2 -g
pm2 start server.js --name "carpooling-backend"
pm2 save
pm2 startup
```

### View Logs
```bash
pm2 logs carpooling-backend
```

---

## Testing the API

### Using Postman or cURL

**1. Health Check**
```bash
curl http://localhost:3000/health
```

**2. Send OTP**
```bash
curl -X POST http://localhost:3000/api/phone-verification/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91XXXXXXXXXX"}'
```

**3. Create Ride**
```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Content-Type: application/json" \
  -d '{
    "driver": {"userId": "user123", "name": "John"},
    "route": {...},
    "schedule": {"departureTime": "2024-02-15T10:00:00Z"},
    "pricing": {"baseFare": 100, "pricePerKm": 10}
  }'
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Coding Standards
- Use ES6+ syntax
- Proper error handling with try-catch
- Consistent naming conventions (camelCase)
- Add comments for complex logic
- Test your changes before submitting PR

---

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

## Security Notes

1. **Never** commit `.env` files with sensitive data
2. Always validate and sanitize user inputs
3. Use HTTPS in production
4. Implement rate limiting for API endpoints
5. Keep dependencies updated
6. Use MongoDB authentication in production

---

##  Future Enhancements

- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Real-time notifications (Socket.io)
- [ ] Advanced analytics dashboard
- [ ] Admin panel for ride management
- [ ] Machine learning for price optimization
- [ ] Multi-language support
- [ ] Emergency contact system

---

##  References

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose ODM](https://mongoosejs.com/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Google Maps API](https://developers.google.com/maps)

---


