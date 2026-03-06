# Projekt: Mitarbeiter-Datenbank (Deutsch)

## Stack
- Datenbank: PostgreSQL (Docker)
- Backend: Node.js + Express
- Frontend: React (Vite)

## 3NF-Modell
- `mitarbeiter` (Stammdaten)
- `kontakt_typ` (Typen: Telefon Büro, Mobil Büro, Mobil privat, Email privat)
- `mitarbeiter_kontakt` (Kontaktwerte pro Typ)
- `abteilung` (Abteilungsstamm)
- `mitarbeiter_abteilung` (n:m-Zuordnung)

Damit sind Mehrfach-Abteilungen sauber normalisiert (3NF) und alle Tabellen haben Primärschlüssel.

## Pflichtfelder
- Vorname
- Nachname
- Mobil privat
- Email privat
- Geburtstag (Format: `DD.MM.YYYY`)

## Start
```bash
# 1) Datenbank starten
cd projekt-mitarbeiter
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
npm install
npm start

# 3) Frontend (neues Terminal)
cd ../frontend
npm install
npm run dev
```

UI: http://localhost:5173
Backend: http://localhost:4000

## Hinweise
- Gleichnamige Personen sind erlaubt (eindeutig über `mitarbeiter_id`).
- Mehrere Abteilungen pro Person sind möglich.
