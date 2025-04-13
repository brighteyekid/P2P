# <img src="public/favicon.ico" width="28" alt="Skill Barter"> Skill Barter: P2P Education Exchange

A modern peer-to-peer platform where users can exchange skills and knowledge with each other. Connect, learn, and teach in a collaborative educational ecosystem.

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-v18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v3-38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-v10-ffca28)

## ✨ Features

- **🔐 User Authentication** - Secure signup and login
- **👤 Profile Management** - Customize your learning and teaching profile
- **🧠 Skill Management** - Add, edit, and track your skills and learning goals
- **🤝 Skill Barter System** - Match with users who can teach what you want to learn
- **💬 Real-time Communication** - Chat with connections and coordinate sessions
- **⭐ Rating & Feedback** - Build reputation through a robust rating system 
- **🎨 Dark Mode UI** - Beautiful, accessible interface with smooth animations

## 🛠️ Tech Stack

### Frontend
- **React + Vite** - Modern UI library with fast build tooling
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for slick transitions
- **React Icons** - Beautiful icon library
- **React Router DOM** - Client-side routing

### Backend
- **Firebase Authentication** - User management and auth
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - File storage
- **Socket.io** - Real-time bidirectional event-based communication

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/p2p-education-barter.git
cd p2p-education-barter
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory and add your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Start the development server**
```bash
npm run dev
```

## 📂 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # Firebase and other services
├── hooks/          # Custom React hooks
├── context/        # React context providers
├── types/          # TypeScript type definitions
├── lib/            # Utility libraries
└── utils/          # Helper functions
```

## 📋 Features in Detail

### User Authentication
- Email and password authentication with Firebase
- Secure session management
- Profile creation with customizable skills and interests

### Skill Management
- Add skills with categories and proficiency levels
- Tag skills for better discoverability
- Manage desired skills to learn
- Set skill preferences and goals

### Skill Barter System
- Browse and search for skills with advanced filtering
- Send connection requests with personalized messages
- Initiate skill exchange sessions with scheduling
- Real-time updates for requests and session status

### Real-time Communication
- Instant messaging with connections
- Session coordination and planning
- Notification system for important events

### Rating System
- Rate skill exchange sessions on multiple criteria
- Provide detailed feedback for improvement
- View aggregate ratings to build reputation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Socket.io](https://socket.io/)

---

<p align="center">
  <img src="public/favicon.ico" width="40" alt="Skill Barter">
  <br>
  <i>Connect. Learn. Teach.</i>
</p>
