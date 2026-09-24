# Edu Veda - Educational Mobile Web Application

A modern, responsive educational web application featuring subject syllabi, video lectures, practice MCQs, mock tests, and Veda AI study assistant.

---

## 🚀 Quick Deployment Guide (ZIP Download & Deploy)

When you download the project ZIP and upload it to your hosting platform (Vercel, Netlify, Cloudflare Pages, Firebase Hosting, VPS, etc.), follow these simple steps:

### 1. Environment Variables (`.env`)

Create a `.env` file in the root directory (or configure Environment Variables in your hosting dashboard such as Vercel / Netlify Settings):

```env
# Optional AI Provider Keys
GEMINI_API_KEY="your_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"
OPENROUTER_API_KEY="your_openrouter_api_key"

# Client Firebase Configuration (Defaults are baked into firebase-applet-config.json)
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_DATABASE_ID="(default)"
```

---

### 2. Deployment Commands

```bash
# Install dependencies
npm install

# Build the project for production
npm run build

# Preview production build locally
npm run preview
```

---

### 3. Deploying to Popular Platforms

#### A. Vercel (Recommended)
1. Import your project directory into Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add your Environment Variables in project settings.

#### B. Netlify
1. Connect repository or drag-and-drop the `dist` folder after running `npm run build`.
2. Build Command: `npm run build`
3. Publish directory: `dist`

#### C. Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase login` and `firebase init hosting`
3. Public directory: `dist`
4. Configure as a single-page app: **Yes**
5. Deploy: `npm run build && firebase deploy`

---

## 🛠 Features

- **Subjects & Lessons**: Real-time subjects, syllabus lessons, and progress tracking.
- **Video Lectures & Notes**: Stream lectures and read PDF/text notes.
- **Practice MCQs & Mock Tests**: Interactive quizzes with instant scoring and explanation.
- **Veda AI Mentor**: AI-powered study assistance and doubt solver.
- **Admin Configuration**: Manage subjects, MCQs, settings, and announcements via Firestore.
