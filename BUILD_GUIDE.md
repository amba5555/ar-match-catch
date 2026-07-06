# AR Math Catch

A standalone browser-based AR educational game for Thai schools. Students use their device camera and MediaPipe hand tracking to catch falling answers.

## Run locally
```bash
npm install
npm run dev
```
Open the Vite URL. Camera access requires `localhost` or HTTPS.

## Build
```bash
npm run build
npm run preview
```
Deploy the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static host.

## Features
- MediaPipe Tasks Vision Hand Landmarker
- Canvas 2D camera rendering, landmarks, falling answer objects, collision
- JSON question banks for Math, Thai vocabulary, and Science
- Teacher page for editing/import/export/local saving
- AI prompt generator for question creation
- Score, lives, timer, combo, level progression, particles, sound effects
- PWA manifest and service worker offline cache
- Thai UI and Noto Sans Thai font

## Question format
```json
{
  "subject": "Mathematics",
  "grade": "1",
  "category": "addition",
  "questions": [{
    "id": "add_001",
    "text": "2 + 3 = ?",
    "answer": 5,
    "options": [5, 4, 6, 3],
    "hint": "Count forward from 2",
    "difficulty": "easy"
  }]
}
```

## Performance notes
- Max active falling objects is limited dynamically.
- MediaPipe uses VIDEO mode and GPU delegate where supported.
- Collision uses index finger tip and palm landmarks for both hands.
