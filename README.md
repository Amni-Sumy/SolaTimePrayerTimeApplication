# SolatTime - Prayer Time Application

An Electron desktop app that shows prayer times, suggests activities, and lets the user save reminders.

## How to run

```bash
npm install
npm start
```

## Pages 

1. **Prayer Times** (`index.html`): search a city, prayer times, Hijri date, weather, Qibla direction, countdown, activity suggestions, Quran verse.
2. **My Reminders** (`reminders.html`): add, view, edit, tick and delete reminders (Local Storage).

## APIs used (free, no API key)

| API | Used for |
|---|---|
| Open-Meteo Geocoding | Find the city, coordinates and time zone |
| Aladhan | Prayer times, Hijri date, Qibla direction |
| Open-Meteo Forecast | Current weather |
| Al-Quran Cloud | Quran verse with English translation |

## Files

- `main.js` - Electron main process (creates the window)
- `index.html`, `renderer.js` - Page 1
- `reminders.html`, `reminders.js` - Page 2 (CRUD)
- `common.js` - Local Storage and message helpers
- `styles.css` - styling
