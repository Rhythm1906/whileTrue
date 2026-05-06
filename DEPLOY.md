# Judges Court - GitHub Pages Deployment Guide

Welcome to **Judges Court**! This is an AI-powered courtroom decision game. Follow the steps below to run locally and deploy to GitHub Pages.

## 🎮 Play Online

**Live Demo:** https://Rhythm1906.github.io/whileTrue/

## 💻 Local Development

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Then open your browser to: `http://localhost:5173/judges-court/`

## 🚀 Deploy to GitHub Pages

### Option 1: Automatic Deployment (GitHub Actions)

The repository is configured with GitHub Actions to automatically build and deploy when you push to `main`.

**Setup:**
1. Go to your GitHub repository Settings
2. Navigate to Pages (left sidebar)
3. Set Source to "Deploy from a branch"
4. Select branch: `main`
5. Select folder: `/docs`
6. Click Save

**Deploy:**
Simply commit and push your changes:
```bash
git add .
git commit -m "Update game"
git push origin main
```

The site will be live at: `https://Rhythm1906.github.io/whileTrue/`

### Option 2: Manual Build & Deploy

```bash
# Build the frontend for production
./build-deploy.sh
```

Or manually:
```bash
cd frontend
npm run build
cd ..
```

This creates optimized files in `/docs` folder. Then:
```bash
git add docs
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## 📁 Project Structure

```
whileTrue/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── styles/          # CSS styles
│   │   ├── App.jsx         # Main app
│   │   └── index.jsx       # Entry point
│   ├── public/
│   │   └── assets/         # Add game images here
│   ├── vite.config.js
│   └── package.json
├── docs/                    # Built output (auto-generated)
├── index.html              # Root redirect page
├── build-deploy.sh         # Deploy script
└── .github/workflows/
    └── deploy.yml          # GitHub Actions config
```

## 🎨 Adding Game Assets

Add your images to: `frontend/public/assets/`

Required files:
- `courtroom-scene.png` - Main courtroom background
- `judge.png` - Judge character sprite
- `defendant.png` - Defendant character sprite  
- `attorney.png` - Attorney character sprite

## 🔧 Configuration

### Change Base URL
If you want to change the base path from `/whileTrue/`, edit `frontend/vite.config.js`:

```javascript
base: process.env.NODE_ENV === 'production' ? '/your-new-path/' : '/judges-court/'
```

### Firebase Configuration
Update `frontend/src/firebase.js` with your Firebase credentials for user authentication and data persistence.

## 📝 Building for Production

```bash
cd frontend
npm run build
```

This creates an optimized build in `../docs/` ready for deployment.

## 🐛 Troubleshooting

**Build fails:**
- Make sure `frontend/node_modules/` exists: `cd frontend && npm install`

**Site shows blank page:**
- Check browser console for errors
- Verify the base path matches your GitHub Pages URL

**Assets not loading:**
- Ensure images are in `frontend/public/assets/`
- Check image file names match the code

## 📚 More Info

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [GitHub Pages Docs](https://pages.github.com/)
- [GitHub Actions CI/CD](https://docs.github.com/en/actions)

---

Made with ⚖️ and React
