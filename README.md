🩺 MediPulse AI
AI-Powered Telemedicine & Health Assistant

🚀 Live Demo: https://medipulse-ai-new.vercel.app/

🌟 Overview

MediPulse AI is a full-stack AI-powered telemedicine platform that provides instant medical assistance through a conversational chatbot and voice assistant.
It enables users to ask health-related questions, get AI-driven insights, and manage appointments — all from a modern, secure web application.

This project was built for AI + Healthcare hackathons, focusing on accessibility, scalability, and real-world impact.

🎯 Problem Statement

Limited access to doctors for basic health queries

Long wait times for non-critical consultations

Lack of instant medical guidance in rural or remote areas

Overloaded healthcare systems

💡 Solution

MediPulse AI acts as a 24/7 virtual health assistant that:

Provides instant AI-generated medical responses

Helps users understand symptoms early

Reduces unnecessary doctor visits

Supports telemedicine workflows digitally


✨ Key Features
🤖 AI Medical Chatbot

Natural-language symptom analysis

Powered by Google Gemini AI

Instant medical guidance and explanations

🎙️ Voice Assistant (In Progress)

Voice-based interaction for accessibility

Designed for hands-free health queries


🔐 Google Authentication

Secure login using Google OAuth 2.0

Protects user identity and data

📅 Appointment Management

Book and manage medical appointments

Designed for future doctor & hospital integration

🌐 Fully Responsive UI

Built with Tailwind CSS

Works seamlessly on mobile & desktop

🧠 How It Works (Architecture)
User (Browser)
   ↓
React Frontend (Vite + TypeScript)
   ↓
Vercel Serverless API (/api/chat)
   ↓
Google Gemini AI
   ↓
AI Response → UI


API keys are never exposed to the frontend

Serverless backend ensures scalability & security


🛠️ Tech Stack
Frontend

React + TypeScript

Vite

Tailwind CSS

Backend

Vercel Serverless Functions

Google Gemini API

Authentication

Google OAuth 2.0

Deployment

Vercel (CI/CD enabled)


🔒 Security & Best Practices

Environment variables for sensitive keys

API calls handled only on server side

OAuth-based authentication

Rate-limit & error handling for AI requests


⚠️ Known Limitations

Gemini API free quota can be exhausted (shows Service Limit Reached)

Voice assistant is partially implemented

No database persistence yet (chat history is not stored)

🚀 Future Enhancements


✅ Full voice-to-voice AI interaction

📊 Health analytics dashboard

🗄️ Database for chat & appointment history

🌍 Multi-language support

🏥 Doctor / hospital onboarding

🛡️ AI safety & medical disclaimers


👨‍💻 Author

Md Aman
AI & Full-Stack Developer
GitHub: https://github.com/MD-AMAN-123

📄 License

This project is licensed under the MIT License.
