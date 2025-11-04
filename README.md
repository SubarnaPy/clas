# Backend API Server

Node.js Express backend with MongoDB for the Kyptronix Nova Nexus application.

## Features

- RESTful API endpoints
- MongoDB database integration
- JWT authentication
- File upload handling
- Rate limiting and security
- Swagger API documentation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Testing
npm test
```

## Deployment

### Render Deployment (Recommended)

1. **Connect Repository**: Go to [Render](https://render.com) and connect your GitHub repository

2. **Create Web Service**:
   - Service Type: Web Service
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   JWT_REFRESH_SECRET=your_secure_refresh_secret
   CORS_ORIGIN=https://your-frontend-domain.netlify.app
   ```

4. **Deploy**: Render will automatically build and deploy your application

### Docker Deployment (Alternative)

If you prefer Docker deployment:

```bash
# Build the image
docker build -t kyptronix-backend .

# Run the container
docker run -p 5112:5112 kyptronix-backend
```

**Note**: For Render, we recommend direct Node.js deployment as shown above.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/node-express-backend` |
| `JWT_SECRET` | JWT signing secret | `fallback-secret-change-in-production` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `fallback-refresh-secret-change-in-production` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

## API Documentation

Once the server is running, visit `http://localhost:5112/api-docs` for Swagger documentation.

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── index.js        # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License
