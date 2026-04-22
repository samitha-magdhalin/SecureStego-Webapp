# SecureStego – Secure AI-Enhanced Steganography Platform

SecureStego is a professional-grade secure communication platform that combines **Asymmetric Cryptography (RSA)**, **LSB Steganography**, and **Blockchain Integrity Verification** to provide a tamper-proof intelligence exchange system.

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

## 🛡️ Security Protocol
- **Private Keys**: Never stored in plain text. Encrypted using AES-256-CBC with a key derived from the user's password.
- **Blockchain**: Validates the hash of every stego-image before allowing extraction.
- **AI Monitoring**: Automatically flags accounts exhibiting bot-like behavior or high-frequency failures.


