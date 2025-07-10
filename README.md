# Market 448 OSR Scoring Tool - Collaborative Assessment Platform

A comprehensive Operating System Review (OSR) assessment tool designed for collaborative team evaluations across multiple stores in Market 448.

## 🚀 Features

- **Multi-User Collaboration**: Real-time shared assessments across team members
- **Persistent Data Storage**: All responses saved to centralized database
- **Intelligent Scoring**: Automatic calculation of assessment scores
- **Progress Tracking**: Visual progress indicators and completion status
- **Store Management**: Support for multiple store assessments
- **Section-Based Evaluation**: Organized assessment categories (Availability, Checkout, Fulfillment, People, Culture & Change)

## 📁 Project Structure

```
osr-deployment-package/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── data/           # Assessment data and configurations
│   │   ├── utils/          # API service and utilities
│   │   └── styles/         # CSS styles
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── backend/                 # Flask backend API
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   └── main.py         # Flask application entry point
│   └── requirements.txt    # Backend dependencies
├── deployment-guide.md     # Detailed deployment instructions
└── README.md              # This file
```

## 🛠 Technology Stack

### Frontend
- **React 18** with Vite build system
- **Modern CSS** with responsive design
- **Fetch API** for backend communication
- **Component-based architecture**

### Backend
- **Flask** web framework
- **SQLAlchemy** ORM for database management
- **Flask-CORS** for cross-origin requests
- **SQLite** database (easily upgradeable to PostgreSQL)

## 🚀 Quick Start

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py
```

## 📋 Deployment Options

1. **Netlify + External Backend**: Deploy frontend to Netlify, backend to Railway/Heroku
2. **Full-Stack Deployment**: Deploy complete application to platforms supporting both frontend and backend
3. **Self-Hosted**: Deploy to your own server infrastructure

See `deployment-guide.md` for detailed deployment instructions.

## 🤝 Collaboration Features

- **Real-Time Sync**: All team members see updates instantly
- **Shared Progress**: Completion status visible to entire team
- **Concurrent Editing**: Multiple users can work on same assessment
- **Data Persistence**: Responses survive page refreshes and sessions

## 📊 Assessment Sections

1. **Availability** - Product availability and inventory management
2. **Checkout** - Customer checkout experience evaluation
3. **Fulfillment** - Order fulfillment and delivery performance
4. **People** - Associate engagement and development
5. **Culture & Change** - Organizational culture assessment

## 🔧 Configuration

The application supports easy configuration for:
- Store information and branding
- Assessment questions and procedures
- Scoring criteria and thresholds
- Database connection settings

## 📝 License

This project is proprietary software developed for Market 448 operations.

## 🆘 Support

For technical support or questions about deployment, refer to the deployment guide or contact the development team.

