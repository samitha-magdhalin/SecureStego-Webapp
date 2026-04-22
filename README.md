# HoloGuard – Secure AI-Enhanced Steganography Platform

HoloGuard is a professional-grade secure communication platform that combines **Asymmetric Cryptography (RSA)**, **LSB Steganography**, and **Blockchain Integrity Verification** to provide a tamper-proof intelligence exchange system.

## 🚀 Key Features

- **Neural Asset Synthesis**: Generate AI cover images using text prompts (Gemini API).
- **Cryptographic Payloads**: RSA-2048 encryption ensures only the intended recipient can read the message.
- **LSB Steganography**: Hide encrypted data within the pixel layers of PNG/JPG images.
- **Immutable Audit Trail**: Every transaction (Send, Extract, Download) is logged on a simulated blockchain.
- **AI Guardian**: Real-time monitoring for brute-force attacks, suspicious download volumes, and unauthorized extraction attempts.
- **Voice Intelligence**: Integrated Speech-to-Text (STT) for message input and Text-to-Speech (TTS) for message recovery.

## 🛠️ Technology Stack

- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express, SQLite3.
- **Security**: node:crypto (RSA/AES), bcryptjs (Password Hashing), JWT (Authentication).
- **Image Processing**: Jimp (Pixel-level manipulation).

## 📋 Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Application
```bash
# Start the development server
npm run dev
```
The application will be available at `http://localhost:3000`.

## 🌐 Deployment Guide (Free Hosting)

### Option A: Render / Railway (Full-Stack)
1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Set the **Build Command**: `npm run build`.
3. Set the **Start Command**: `node server.ts`.
4. Add your `GEMINI_API_KEY` to the environment variables in the dashboard.
5. Ensure the `uploads/` directory is handled (Note: Free tiers often have ephemeral storage; for production, use S3 or Cloudinary).

### Option B: Vercel (Frontend Only - Requires API refactor)
*Note: This app requires a persistent backend and SQLite database. For Vercel, you would need to migrate the database to a managed service like Supabase or Neon.*

## 🛡️ Security Protocol
- **Private Keys**: Never stored in plain text. Encrypted using AES-256-CBC with a key derived from the user's password.
- **Blockchain**: Validates the hash of every stego-image before allowing extraction.
- **AI Monitoring**: Automatically flags accounts exhibiting bot-like behavior or high-frequency failures.

---
*Developed for BCA Level Security & Cryptography Project.*
