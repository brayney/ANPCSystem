# ANPC Yard - Equipment Tracking System

A comprehensive web-based system for managing equipment inventory including cranes, hooks, counterweights, and boom sections.

## Features

✅ **Equipment Management**
- Create, read, update, and delete equipment records
- Support for 4 equipment types: Cranes, Hooks, Counterweights, Boom Sections
- Auto-formatting for weight values (e.g., "100" → "100kg")

✅ **CSV Import/Export**
- Import equipment data via CSV files
- Professional templates for each equipment type
- Bulk data operations

✅ **User Authentication**
- Secure login with JWT tokens
- Role-based access control (Admin/User)
- Password encryption with bcryptjs

✅ **Dashboard**
- Real-time equipment statistics
- Status overview
- Quick access to all equipment types

✅ **Responsive UI**
- Modern React interface
- Works on desktop and mobile devices
- Dark/light theme support

## Technology Stack

### Backend
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **File Upload:** Multer
- **Image Storage:** Cloudinary

### Frontend
- **Framework:** React 18
- **Router:** React Router v6
- **HTTP Client:** Axios
- **UI Library:** Tailwind CSS + Headless UI
- **Icons:** Heroicons
- **Notifications:** React Hot Toast

## Project Structure

```
anpc-yard/
├── backend/
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth, error handling
│   ├── utils/           # Helper functions
│   ├── config/          # Database, Cloudinary config
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Helper functions
│   │   └── App.js       # Main component
│   ├── public/          # Static files & templates
│   └── package.json
└── render.yaml          # Render deployment config
```

## Local Development Setup

### Prerequisites
- Node.js v16+ 
- npm or yarn
- MongoDB local or Atlas
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/anpc-yard.git
cd anpc-yard
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your local configuration
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local if needed
npm start
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/anpc-yard
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Deployment

For production deployment on Render and Vercel:

📋 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions**

Quick overview:
1. Set up MongoDB Atlas (free tier available)
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Configure environment variables
5. Test the deployment

**Checklist:** See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Default Login Credentials

```
Email: admin@anpc.com
Password: admin123
```

(Change immediately after first login in production)

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend-domain.com/api`

### Key Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

#### Equipment
- `GET /api/cranes` - Get all cranes
- `POST /api/cranes` - Create crane
- `PUT /api/cranes/:id` - Update crane
- `DELETE /api/cranes/:id` - Delete crane
- `POST /api/cranes/import` - Import cranes from CSV

Similar endpoints exist for:
- `/api/hooks`
- `/api/counterweights`
- `/api/boom-sections`

## CSV Import Format

Templates are available in `frontend/public/templates/`:
- `cranes-template.csv`
- `hooks-template.csv`
- `counterweights-template.csv`
- `boom-sections-template.csv`

**Important:** 
- Keep the header row and comment lines intact
- Fill data starting from row 10
- Save files as .csv (not xlsx)

## Features in Development

- [ ] Advanced search and filtering
- [ ] Custom reports
- [ ] Equipment maintenance tracking
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Advanced audit logging

## Troubleshooting

### Cannot connect to MongoDB
- Verify MongoDB service is running
- Check connection string in .env
- For Atlas: verify IP whitelist includes your current IP

### API calls failing
- Check backend is running on port 5000
- Verify CORS is enabled
- Check API URL in frontend .env

### CSV import not working
- Ensure file is in .csv format (not xlsx)
- Check file is not corrupted
- Verify all required fields are present

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for more troubleshooting help.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or suggestions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
3. Open an GitHub issue
4. Contact the development team

---

**Built with ❤️ for SARENS NASS ANPC Yard**
