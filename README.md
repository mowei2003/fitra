# Fitness Trainer

Persönlicher Workout Tracker als Progressive Web App (PWA).

## Features

- Mehrere Workouts speichern und verwalten
- Sätze sequenziell abhaken
- Automatischer Pausen-Timer mit Vibration
- Workout-Timer
- Ergebnis-Screen mit Fortschrittsring
- Daten werden lokal gespeichert (localStorage)
- Installierbar als PWA auf iOS und Android

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Deployment auf GitHub Pages

### Automatisch (empfohlen)

1. Repository auf GitHub erstellen
2. Code pushen (`git push origin main`)
3. Auf GitHub unter **Settings → Pages → Source** die Option **"GitHub Actions"** auswählen
4. Die App wird bei jedem Push zu `main` automatisch gebaut und deployed

Die App ist dann erreichbar unter:
`https://DEIN-USERNAME.github.io/REPO-NAME/`

### Manuell

```bash
npm run build
# Den Inhalt des dist/ Ordners manuell auf GitHub Pages deployen
```

## Als PWA auf dem iPhone installieren

1. App-URL in Safari öffnen
2. Teilen-Button → "Zum Home-Bildschirm"
3. Fertig – läuft wie eine native App
