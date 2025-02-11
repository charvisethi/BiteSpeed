# BiteSpeed Backend API

## Overview
This is a backend API built with Node.js and Express.js, using MongoDB as the database. The API provides functionality for managing contacts, including creating and merging contacts based on emails and phone numbers.

## Features
- Store and manage contacts in MongoDB.
- Merge contacts based on matching emails or phone numbers.
- Retrieve all stored contacts.

## Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB** with Mongoose ORM
- **Render** for deployment

## Setup Instructions

### Prerequisites
- Node.js installed (v14+ recommended)
- MongoDB Atlas or a local MongoDB instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/charvisethi/BiteSpeed.git
   cd BiteSpeed
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and set up your environment variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=10000
   ```
4. Start the server:
   ```bash
   node index.js
   ```

## API Endpoints

### **1. Identify Contact (POST /identify)**
**Endpoint:**
```
POST /identify
```
**Description:**
- Accepts an email and/or phone number to create or merge contacts.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```
**Response:**
```json
{
  "_id": "65a7f9a2e8b9c2c3a1d4a5b6",
  "name": ["John Doe"],
  "emails": ["john@example.com"],
  "phoneNumbers": ["+1234567890"],
  "secondaryContactIds": [],
  "updatedAt": "2025-02-11T12:00:00.000Z",
  "createdAt": "2025-02-11T12:00:00.000Z",
  "__v": 0
}
```

### **2. Get All Contacts (GET /identify)**
**Endpoint:**
```
GET /identify
```
**Description:**
- Retrieves all stored contacts from the database.

**Response:**
```json
[
  {
    "_id": "65a7f9a2e8b9c2c3a1d4a5b6",
    "name": ["John Doe"],
    "emails": ["john@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": [],
    "updatedAt": "2025-02-11T12:00:00.000Z",
    "createdAt": "2025-02-11T12:00:00.000Z",
    "__v": 0
  }
]
```

## Deployment
The API is deployed on Render. You can access it at:
```
https://bitespeed-qvnt.onrender.com
```

## Testing the API
You can use **Postman** or **cURL** to test the endpoints.

### **Example cURL for POST request**
```bash
curl -X POST "https://bitespeed-qvnt.onrender.com/identify" \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890"}'
```

## License
This project is open-source and available under the MIT License.

---
🚀 **Developed with ❤️ by Charvi Sethi**

