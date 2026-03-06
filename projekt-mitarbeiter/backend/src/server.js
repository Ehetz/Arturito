import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const requiredFields = ['vorname', 'nachname', 'geburtstag', 'mobil_privat', 'email_privat'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidDateParts(day, month, year) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

function validatePayload(body) {
  for (const f of requiredFields) {
    if (!body[f] || String(body[f]).trim() === '') return `Pflichtfeld fehlt: ${f}`;
  }

  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(body.geburtstag)) {
    return 'Geburtstag muss Format DD.MM.YYYY haben';
  }

  const [day, month, year] = body.geburtstag.split('.');
  if (!isValidDateParts(day, month, year)) {
    return 'Geburtstag ist kein gültiges Datum';
  }

  if (!emailRegex.test(body.email_privat)) {
    return 'Email privat ist ungültig';
  }

  return null;
}

function toIsoDate(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('.');
  return `${y}-${m}-${d}`;
}

function normalizeAbteilungen(list = []) {
  return [...new Set(list.map((x) => String(x).trim()).filter(Boolean))];
}

async function upsertKontakt(client, mitarbeiterId, code, wert) {
  if (wert === undefined || wert === null || String(wert).trim() === '') {
    await client.query(
      `DELETE FROM mitarbeiter_kontakt
       WHERE mitarbeiter_id = $1
       AND kontakt_typ_id = (SELECT kontakt_typ_id FROM kontakt_typ WHERE code = $2)`,
      [mitarbeiterId, code]
    );
    return;
  }

  await client.query(
    `INSERT INTO mitarbeiter_kontakt (mitarbeiter_id, kontakt_typ_id, wert)
     SELECT $1, kt.kontakt_typ_id, $3
     FROM kontakt_typ kt
     WHERE kt.code = $2
     ON CONFLICT (mitarbeiter_id, kontakt_typ_id)
     DO UPDATE SET wert = EXCLUDED.wert`,
    [mitarbeiterId, code, String(wert).trim()]
  );
}

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

app.get('/api/abteilungen', async (_req, res) => {
  const r = await pool.query('SELECT abteilung_id, name FROM abteilung ORDER BY name');
  res.json(r.rows);
});

app.post('/api/abteilungen', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name fehlt' });
  const r = await pool.query(
    'INSERT INTO abteilung (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING *',
    [name]
  );
  res.json(r.rows[0]);
});

app.get('/api/mitarbeiter', async (_req, res) => {
  const r = await pool.query(`
    SELECT m.mitarbeiter_id, m.vorname, m.nachname,
           to_char(m.geburtstag, 'DD.MM.YYYY') AS geburtstag,
           MAX(CASE WHEN kt.code='telefon_buero' THEN mk.wert END) AS telefon_buero,
           MAX(CASE WHEN kt.code='mobil_buero' THEN mk.wert END) AS mobil_buero,
           MAX(CASE WHEN kt.code='mobil_privat' THEN mk.wert END) AS mobil_privat,
           MAX(CASE WHEN kt.code='email_privat' THEN mk.wert END) AS email_privat,
           COALESCE(array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL), '{}') AS abteilungen
    FROM mitarbeiter m
    LEFT JOIN mitarbeiter_kontakt mk ON mk.mitarbeiter_id = m.mitarbeiter_id
    LEFT JOIN kontakt_typ kt ON kt.kontakt_typ_id = mk.kontakt_typ_id
    LEFT JOIN mitarbeiter_abteilung ma ON ma.mitarbeiter_id = m.mitarbeiter_id
    LEFT JOIN abteilung a ON a.abteilung_id = ma.abteilung_id
    GROUP BY m.mitarbeiter_id
    ORDER BY m.nachname, m.vorname
  `);
  res.json(r.rows);
});

app.post('/api/mitarbeiter', async (req, res) => {
  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ error });

  const {
    vorname, nachname, geburtstag,
    telefon_buero, mobil_buero, mobil_privat, email_privat,
    abteilungen = []
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Requirement: free IDs should be reused after deletion.
    // Lock table during ID allocation to avoid duplicate assignment in concurrent inserts.
    await client.query('LOCK TABLE mitarbeiter IN EXCLUSIVE MODE');
    const nextIdRes = await client.query(`
      SELECT COALESCE(
        (
          SELECT gs
          FROM generate_series(
            1,
            COALESCE((SELECT MAX(mitarbeiter_id) FROM mitarbeiter), 0) + 1
          ) AS gs
          EXCEPT
          SELECT mitarbeiter_id FROM mitarbeiter
          ORDER BY gs
          LIMIT 1
        ),
        1
      ) AS next_id
    `);
    const nextId = Number(nextIdRes.rows[0].next_id);

    const m = await client.query(
      'INSERT INTO mitarbeiter (mitarbeiter_id, vorname, nachname, geburtstag) VALUES ($1, $2, $3, $4) RETURNING mitarbeiter_id',
      [nextId, String(vorname).trim(), String(nachname).trim(), toIsoDate(geburtstag)]
    );
    const id = m.rows[0].mitarbeiter_id;

    await upsertKontakt(client, id, 'telefon_buero', telefon_buero);
    await upsertKontakt(client, id, 'mobil_buero', mobil_buero);
    await upsertKontakt(client, id, 'mobil_privat', mobil_privat);
    await upsertKontakt(client, id, 'email_privat', email_privat);

    for (const depName of normalizeAbteilungen(abteilungen)) {
      const dep = await client.query(
        'INSERT INTO abteilung (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING abteilung_id',
        [depName]
      );
      await client.query(
        'INSERT INTO mitarbeiter_abteilung (mitarbeiter_id, abteilung_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, dep.rows[0].abteilung_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ mitarbeiter_id: id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.put('/api/mitarbeiter/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ungültige ID' });

  const error = validatePayload(req.body);
  if (error) return res.status(400).json({ error });

  const {
    vorname, nachname, geburtstag,
    telefon_buero, mobil_buero, mobil_privat, email_privat,
    abteilungen = []
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updated = await client.query(
      'UPDATE mitarbeiter SET vorname=$1, nachname=$2, geburtstag=$3 WHERE mitarbeiter_id=$4 RETURNING mitarbeiter_id',
      [String(vorname).trim(), String(nachname).trim(), toIsoDate(geburtstag), id]
    );

    if (updated.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
    }

    await upsertKontakt(client, id, 'telefon_buero', telefon_buero);
    await upsertKontakt(client, id, 'mobil_buero', mobil_buero);
    await upsertKontakt(client, id, 'mobil_privat', mobil_privat);
    await upsertKontakt(client, id, 'email_privat', email_privat);

    await client.query('DELETE FROM mitarbeiter_abteilung WHERE mitarbeiter_id=$1', [id]);
    for (const depName of normalizeAbteilungen(abteilungen)) {
      const dep = await client.query(
        'INSERT INTO abteilung (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING abteilung_id',
        [depName]
      );
      await client.query(
        'INSERT INTO mitarbeiter_abteilung (mitarbeiter_id, abteilung_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, dep.rows[0].abteilung_id]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.delete('/api/mitarbeiter/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Ungültige ID' });
  const r = await pool.query('DELETE FROM mitarbeiter WHERE mitarbeiter_id=$1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Mitarbeiter nicht gefunden' });
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend läuft auf Port ${port}`);
});
