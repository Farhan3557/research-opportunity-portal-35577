# University Research Opportunity Portal

A web app where faculty can post and manage research opportunities.

- **Backend:** Node.js + Express REST API
- **Database:** MySQL
- **Frontend:** HTML + Bootstrap + JavaScript (served by the backend)

GitHub Repository: https://github.com/username/research-opportunity-portal

## Project Structure

```
backend/     Express API (server.js)
frontend/    index.html, script.js
database/    schema.sql
postman/     Exported Postman collection
```

## Setup and Run

**Requirements:** Node.js (v18+) and MySQL.

1. Create the database and table:
   ```
   mysql -u root -p < database/schema.sql
   ```
2. Install backend packages:
   ```
   cd backend
   npm install
   ```
3. Create your `.env` file (copy `.env.example` to `.env`) and enter your MySQL password.
4. Start the server:
   ```
   npm start
   ```
5. Open **http://localhost:3000** in the browser.

## API Endpoints

| Method | URL | Description | Success code |
|--------|-----|-------------|--------------|
| POST   | /api/opportunities     | Create | 201 |
| GET    | /api/opportunities     | Get all | 200 |
| GET    | /api/opportunities/:id | Get one | 200 |
| PUT    | /api/opportunities/:id | Update | 200 |
| DELETE | /api/opportunities/:id | Delete | 200 |

Errors: `400` invalid/missing data, `404` not found, `500` server error.

### Example body (POST)

```json
{
  "title": "Deep Learning for Medical Imaging",
  "description": "Build models to detect diseases from X-ray images.",
  "researchArea": "Artificial Intelligence",
  "facultyName": "Dr. Ahmed Khan",
  "department": "Computer Science",
  "requiredSkills": "Python, PyTorch",
  "positions": 2,
  "deadline": "2026-12-31",
  "status": "Open"
}
```

## Testing with Postman

Import `postman/Research-Portal.postman_collection.json`. Requests are numbered in order. Set the collection variable `id` to the ID of the opportunity you want to update/close/delete.
