# Link in Bio Website

A secure and customizable Link in Bio website built with Node.js, Express, and MongoDB. This application allows you to create and manage your personal profile with social media links and other important information.

## Features

- Secure authentication with JWT and HTTP-only cookies
- Protected admin dashboard for managing links and profile
- Rate limiting and security headers for protection against attacks
- Profile management (name, bio, avatar)
- Social media links management with drag-and-drop reordering
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd linkinbio
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/linkinbio
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

4. Start the development server:
```bash
npm run dev
```

## Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks
- Helmet security headers
- Input validation and sanitization
- CORS protection
- Secure password change mechanism

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login with email and password
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user info

### Profile
- GET `/api/profile/:username` - Get public profile
- PUT `/api/profile` - Update profile (protected)
- PUT `/api/profile/change-password` - Change password (protected)

### Links
- GET `/api/links` - Get all active links
- POST `/api/links` - Create new link (protected)
- PUT `/api/links/:id` - Update link (protected)
- DELETE `/api/links/:id` - Delete link (protected)
- POST `/api/links/reorder` - Reorder links (protected)

## Production Deployment

1. Set appropriate environment variables
2. Build the frontend (if applicable)
3. Set NODE_ENV to 'production'
4. Use a process manager like PM2
5. Set up a reverse proxy (nginx recommended)

## Security Best Practices

- Keep your JWT_SECRET secure and complex
- Regularly update dependencies
- Monitor server logs for suspicious activities
- Use HTTPS in production
- Implement regular database backups

## License

MIT 