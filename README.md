markdown
# 🏨 LuxStay - Hotel Booking System

Welcome to the LuxStay hotel booking platform. This is a full-stack web application built with Node.js, Express, MySQL, and JWT authentication.

## 🚀 How to Run This Project on Your Machine

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Mohammud-15/LuxStay-Hotel-Booking.git
    cd LuxStay-Hotel-Booking
Install dependencies:

bash
npm install
Set up the environment variables (.env):
Create a .env file in the root directory and add the following:

text
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
JWT_SECRET=LuxStay@2025_SuperSecureKey_#9fK2mP!
Set up the database:
Open MySQL Workbench and run:

sql
CREATE DATABASE luxstay;
USE luxstay;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
-- (Note: The 'bookings' table will be created automatically upon the first booking)
Start the server:

bash
node server.js
Open your browser:
Navigate to http://localhost:3000
