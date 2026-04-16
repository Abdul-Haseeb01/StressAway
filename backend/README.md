# StressAway Backend

NestJS-based REST API for the StressAway mental wellness platform.

## Features

- 🔐 JWT Authentication with role-based access control
- 📝 Questionnaire-based stress assessment with weighted scoring
- 😊 Facial emotion recognition integration
- 💬 Rule-based mental wellness chatbot
- 👥 Social connections (psychologist/family)
- 🚨 Emergency SOS system
- 🧘 Wellness activities management
- 👨‍💼 Admin dashboard and analytics

## Tech Stack

- **Framework**: NestJS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Validation**: class-validator
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
PORT=3001
```

3. Set up the database:
- Run `database/schema.sql` in your Supabase SQL editor
- Run `database/seed.sql` to add sample data

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at http://localhost:3001/api

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Questionnaire
- `GET /api/questionnaire/questions` - Get all questions
- `POST /api/questionnaire/submit` - Submit questionnaire
- `GET /api/questionnaire/logs` - Get user's logs
- `GET /api/questionnaire/stats` - Get statistics

### Facial Emotion
- `POST /api/facial-emotion/predict` - Predict emotion
- `GET /api/facial-emotion/logs` - Get user's logs
- `GET /api/facial-emotion/stats` - Get statistics

### Chatbot
- `POST /api/chatbot/send` - Send message
- `GET /api/chatbot/history` - Get chat history

### Connections
- `POST /api/connections/request` - Create connection request
- `PUT /api/connections/:id/approve` - Approve connection
- `PUT /api/connections/:id/reject` - Reject connection
- `GET /api/connections` - Get user's connections
- `DELETE /api/connections/:id` - Delete connection
- `GET /api/connections/psychologists` - Search psychologists

### SOS
- `POST /api/sos/trigger` - Trigger SOS alert
- `GET /api/sos/alerts` - Get user's alerts
- `PUT /api/sos/:id/acknowledge` - Acknowledge alert
- `PUT /api/sos/:id/resolve` - Resolve alert
- `GET /api/sos/active` - Get active alerts for connected users

### Wellness
- `POST /api/wellness/mood` - Log mood
- `GET /api/wellness/mood/history` - Get mood history
- `GET /api/wellness/activities` - Get all activities
- `POST /api/wellness/activity/complete` - Complete activity
- `GET /api/wellness/activity/history` - Get activity history
- `GET /api/wellness/recommended` - Get recommended activities
- `GET /api/wellness/stats` - Get wellness statistics

### Admin (Admin role required)
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `PUT /api/admin/users/:id/activate` - Activate user

## Project Structure

```
backend/
├── src/
│   ├── auth/                  # Authentication module
│   ├── questionnaire/         # Questionnaire module
│   ├── facial-emotion/        # Facial emotion module
│   ├── chatbot/              # Chatbot module
│   ├── connections/          # Connections module
│   ├── sos/                  # SOS module
│   ├── wellness/             # Wellness module
│   ├── admin/                # Admin module
│   ├── common/               # Shared utilities
│   │   ├── supabase.service.ts
│   │   ├── filters/
│   │   └── pipes/
│   ├── app.module.ts         # Root module
│   └── main.ts               # Application entry point
├── database/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Sample data
└── package.json
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Role-Based Access Control

Three user roles:
- `user` - Regular users
- `psychologist` - Mental health professionals
- `admin` - Platform administrators

## Sample Credentials (from seed data)

```
Admin:
Email: admin@stressaway.com
Password: Test123!

Psychologist:
Email: dr.smith@stressaway.com
Password: Test123!

User:
Email: john.doe@example.com
Password: Test123!
```

## Development

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Linting
npm run lint
```

## Error Handling

All errors are handled by the global exception filter and return consistent JSON responses:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with expiration
- CORS enabled for frontend
- Input validation on all endpoints
- Row Level Security (RLS) in Supabase

## License

This project is for educational and mental wellness purposes.
