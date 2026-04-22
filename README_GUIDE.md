
# 🛡️ HoloGuard: AI Phishing Protection Setup Guide

HoloGuard is a full-stack cybersecurity platform designed to detect **Homograph Attacks** (links that use look-alike letters to steal data).

## 🚀 Quick Setup (Development)

1.  **Backend**: 
    - Install Python 3.9+
    - Run `pip install fastapi uvicorn idna pydantic`
    - Start server: `python backend_main.py` (Running on `http://localhost:8000`)
2.  **Frontend**: 
    - The app is currently running in this browser window.
3.  **Browser Extension**:
    - Open Chrome and go to `chrome://extensions`
    - Enable **Developer Mode** (top right)
    - Click **Load Unpacked**
    - Select the folder containing the extension files (`manifest.json`, `background.js`, `popup.*`)

## 🌍 Free-Tier Deployment (Production)

-   **Backend**: Deploy `backend_main.py` to **Render** as a "Web Service". It's free!
-   **Frontend**: Connect your GitHub repo to **Vercel**. It's free!
-   **Extension**: Once your backend is deployed, update the URL in `popup.js` to point to your new Render link.

## 🛡️ Sample Links for Testing
-   **Legit**: `google.com`
-   **Homograph**: `googlе.com` (Note: This uses a Cyrillic 'е')
-   **Typosquat**: `go0gle.com`

## 💎 Viva/Demo Points
-   **AI Explainability**: Uses Gemini AI to explain *why* a link is dangerous in human terms.
-   **Entropy Scoring**: Uses mathematical chaos (entropy) to find robot-generated domains.
-   **Real-time Intercept**: The extension blocks navigation to high-risk links before they load.
