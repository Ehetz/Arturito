import React, { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  vorname: '',
  nachname: '',
  geburtstag: '',
  telefon_buero: '',
  mobil_buero: '',
  mobil_privat: '',
  email_privat: '',
  abteilungenText: ''
};

export default function App() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [view, setView] = useState('verwaltung');
  const [coworkers, setCoworkers] = useState([]);

  const coworkerIds = [2, 4, 5, 11, 12, 30, 32];

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/mitarbeiter');
      const data = await r.json();
      setRows(data);
    } catch (_e) {
      setError('Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadCoworkers = async () => {
    try {
      const r = await fetch(`/api/mitarbeiter?ids=${coworkerIds.join(',')}`);
      const data = await r.json();
      const order = new Map(coworkerIds.map((id, idx) => [id, idx]));
      data.sort((a, b) => (order.get(a.mitarbeiter_id) ?? 999) - (order.get(b.mitarbeiter_id) ?? 999));
      setCoworkers(data);
    } catch (_e) {
      setError('Info-Seite konnte nicht geladen werden');
    }
  };

  useEffect(() => {
    load();
    loadCoworkers();
  }, []);

  useEffect(() => {
    if (view !== 'info') return;
    const t = setInterval(loadCoworkers, 15000);
    return () => clearInterval(t);
  }, [view]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const payload = () => ({
    ...form,
    abteilungen: form.abteilungenText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  });

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? rows
      : rows.filter((r) => {
          const searchable = [
            String(r.mitarbeiter_id),
            r.vorname,
            r.nachname,
            r.mobil_privat,
            r.email_privat,
            ...(r.abteilungen || [])
          ]
            .join(' ')
            .toLowerCase();
          return searchable.includes(q);
        });

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'id') return (a.mitarbeiter_id - b.mitarbeiter_id) * dir;
      if (sortBy === 'nachname') return a.nachname.localeCompare(b.nachname, 'de') * dir;
      if (sortBy === 'vorname') return a.vorname.localeCompare(b.vorname, 'de') * dir;
      if (sortBy === 'geburtstag') {
        const [da, ma, ya] = String(a.geburtstag || '').split('.');
        const [db, mb, yb] = String(b.geburtstag || '').split('.');
        const ta = new Date(`${ya}-${ma}-${da}`).getTime() || 0;
        const tb = new Date(`${yb}-${mb}-${db}`).getTime() || 0;
        return (ta - tb) * dir;
      }
      return 0;
    });

    return sorted;
  }, [rows, search, sortBy, sortDir]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/mitarbeiter/${editingId}` : '/api/mitarbeiter';

    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload())
    });

    if (!r.ok) {
      const data = await r.json();
      setError(data.error || 'Fehler beim Speichern');
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setSearch('');
    setSuccess(editingId ? 'Mitarbeiter erfolgreich aktualisiert.' : 'Mitarbeiter erfolgreich angelegt.');
    await load();
  };

  const remove = async (id) => {
    if (!confirm('Wirklich löschen?')) return;
    const r = await fetch(`/api/mitarbeiter/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const data = await r.json();
      setError(data.error || 'Löschen fehlgeschlagen');
      return;
    }
    await load();
  };

  const edit = (row) => {
    setEditingId(row.mitarbeiter_id);
    setForm({
      vorname: row.vorname || '',
      nachname: row.nachname || '',
      geburtstag: row.geburtstag || '',
      telefon_buero: row.telefon_buero || '',
      mobil_buero: row.mobil_buero || '',
      mobil_privat: row.mobil_privat || '',
      email_privat: row.email_privat || '',
      abteilungenText: (row.abteilungen || []).join(', ')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  return (
    <div className="wrap">
      <header className="topbar">
        <div>
          <h1>Mitarbeiter-Datenbank</h1>
          <p className="muted">3NF · Deutsch · CRUD für Personaldaten</p>
        </div>
        <div className="stats">
          <button className={view === 'verwaltung' ? '' : 'ghost'} onClick={() => setView('verwaltung')}>
            Verwaltung
          </button>
          <button className={view === 'info' ? '' : 'ghost'} onClick={() => setView('info')}>
            Info-Seite
          </button>
        </div>
      </header>

      {view === 'info' ? (
        <div className="card">
          <div className="tableHead">
            <h2>Info-Seite (nur Lesen)</h2>
            <span className="pill">Live-Update: 15s</span>
          </div>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Nachname</th>
                  <th>Vorname</th>
                  <th>Mobil Büro</th>
                  <th>Abteilungen</th>
                </tr>
              </thead>
              <tbody>
                {coworkers.map((r) => (
                  <tr key={r.mitarbeiter_id}>
                    <td>{r.nachname}</td>
                    <td>{r.vorname}</td>
                    <td>{r.mobil_buero || ''}</td>
                    <td>
                      <div className="tags">
                        {(r.abteilungen || []).map((dep) => (
                          <span key={`${r.mitarbeiter_id}-${dep}`} className="tag">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <>
      <div className="stats" style={{ marginBottom: '10px' }}>
        <span className="pill">Gesamt: {rows.length}</span>
        <span className="pill">Gefiltert: {filteredRows.length}</span>
      </div>

      <form className="card" onSubmit={submit}>
        <h2>{editingId ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}</h2>
        <div className="grid">
          <input name="vorname" placeholder="Vorname *" value={form.vorname} onChange={onChange} required />
          <input name="nachname" placeholder="Nachname *" value={form.nachname} onChange={onChange} required />
          <input name="geburtstag" placeholder="Geburtstag (DD.MM.YYYY) *" value={form.geburtstag} onChange={onChange} required />
          <input name="telefon_buero" placeholder="Telefon Büro" value={form.telefon_buero} onChange={onChange} />
          <input name="mobil_buero" placeholder="Mobil Büro" value={form.mobil_buero} onChange={onChange} />
          <input name="mobil_privat" placeholder="Mobil privat *" value={form.mobil_privat} onChange={onChange} required />
          <input name="email_privat" placeholder="Email privat *" value={form.email_privat} onChange={onChange} required />
          <input name="abteilungenText" placeholder="Abteilungen (kommagetrennt)" value={form.abteilungenText} onChange={onChange} />
        </div>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <div className="actions">
          <button type="submit">{editingId ? 'Speichern' : 'Anlegen'}</button>
          {editingId && (
            <button type="button" className="ghost" onClick={resetForm}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="tableHead">
          <h2>Übersicht</h2>
          <div className="toolbar">
            <input
              className="search"
              placeholder="Suche (Name, ID, Abteilung, Mail...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="id">Sortieren: ID</option>
              <option value="nachname">Sortieren: Nachname</option>
              <option value="vorname">Sortieren: Vorname</option>
              <option value="geburtstag">Sortieren: Geburtstag</option>
            </select>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
              <option value="asc">Aufsteigend (A-Z / 1-9)</option>
              <option value="desc">Absteigend (Z-A / 9-1)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="muted">Lade Daten ...</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nachname</th>
                  <th>Vorname</th>
                  <th>Geburtstag</th>
                  <th>Mobil privat</th>
                  <th>Email privat</th>
                  <th>Abteilungen</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.mitarbeiter_id}>
                    <td>{r.mitarbeiter_id}</td>
                    <td>{r.nachname}</td>
                    <td>{r.vorname}</td>
                    <td>{r.geburtstag}</td>
                    <td>{r.mobil_privat}</td>
                    <td>{r.email_privat}</td>
                    <td>
                      <div className="tags">
                        {(r.abteilungen || []).map((dep) => (
                          <span key={`${r.mitarbeiter_id}-${dep}`} className="tag">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button onClick={() => edit(r)}>Bearbeiten</button>
                      <button className="danger" onClick={() => remove(r.mitarbeiter_id)}>
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
