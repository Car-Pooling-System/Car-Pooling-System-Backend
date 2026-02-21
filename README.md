# Car Pooling System - Backend

A robust and scalable Node.js backend for a ride-sharing application.

## Local Development (Docker)

This project is fully containerized for a seamless development experience.

### Prerequisites

- **Docker Desktop** (No other dependencies like Node.js or MongoDB are required locally)

### Setup & Installation

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/nanducc/car-pooling-system-backend.git
    cd car-pooling-system-backend
    ```

2.  **Environment Variables**
    Create a .env file in the root directory (ask your teammate for the correct values if not provided).

3.  **Run the Server**
    ```bash
    docker compose up
    ```
    The server will be available at: http://localhost:3000

### Common Commands

- **Build and Run (after changes)**:

  ```bash
  docker compose up --build
  ```

- **Stop the Containers**:

  ```bash
  docker compose down
  ```

- **Run in Background**:
  ```bash
  docker compose up -d
  ```

## Project Structure

- **config/**: Configuration files (database, etc.)
- **models/**: Mongoose schemas
- **routes/**: API route definitions
- **utils/**: Shared utility functions
- **server.js**: Entry point
- **Dockerfile**: Docker build configuration
- **docker-compose.yml**: Service orchestration
