CREATE TABLE IF NOT EXISTS mitarbeiter (
  mitarbeiter_id SERIAL PRIMARY KEY,
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  geburtstag DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kontakt_typ (
  kontakt_typ_id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  bezeichnung TEXT UNIQUE NOT NULL
);

INSERT INTO kontakt_typ (code, bezeichnung)
VALUES
  ('telefon_buero', 'Telefon Büro'),
  ('mobil_buero', 'Mobil Büro'),
  ('mobil_privat', 'Mobil privat'),
  ('email_privat', 'Email privat')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS mitarbeiter_kontakt (
  mitarbeiter_kontakt_id SERIAL PRIMARY KEY,
  mitarbeiter_id INT NOT NULL REFERENCES mitarbeiter(mitarbeiter_id) ON DELETE CASCADE,
  kontakt_typ_id INT NOT NULL REFERENCES kontakt_typ(kontakt_typ_id),
  wert TEXT NOT NULL,
  UNIQUE (mitarbeiter_id, kontakt_typ_id)
);

CREATE TABLE IF NOT EXISTS abteilung (
  abteilung_id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS mitarbeiter_abteilung (
  mitarbeiter_id INT NOT NULL REFERENCES mitarbeiter(mitarbeiter_id) ON DELETE CASCADE,
  abteilung_id INT NOT NULL REFERENCES abteilung(abteilung_id) ON DELETE CASCADE,
  PRIMARY KEY (mitarbeiter_id, abteilung_id)
);

CREATE INDEX IF NOT EXISTS idx_mitarbeiter_name ON mitarbeiter (nachname, vorname);
