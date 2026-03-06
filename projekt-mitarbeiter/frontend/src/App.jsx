import React, { useEffect, useState } from 'react';

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

  const load = async () => {
    const r = await fetch('/api/mitarbeiter');
    setRows(await r.json());
  };

  useEffect(() => { load(); }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const payload = () => ({
    ...form,
    abteilungen: form.abteilungenText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
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
    await load();
  };

  const remove = async (id) => {
    if (!confirm('Wirklich löschen?')) return;
    await fetch(`/api/mitarbeiter/${id}`, { method: 'DELETE' });
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

  return (
    <div className="wrap">
      <h1>Mitarbeiter-Datenbank</h1>

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
        <div className="actions">
          <button type="submit">{editingId ? 'Speichern' : 'Anlegen'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Abbrechen</button>}
        </div>
      </form>

      <div className="card">
        <h2>Übersicht</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nachname</th><th>Vorname</th><th>Geburtstag</th><th>Mobil privat</th><th>Email privat</th><th>Abteilungen</th><th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.mitarbeiter_id}>
                <td>{r.mitarbeiter_id}</td>
                <td>{r.nachname}</td>
                <td>{r.vorname}</td>
                <td>{r.geburtstag}</td>
                <td>{r.mobil_privat}</td>
                <td>{r.email_privat}</td>
                <td>{(r.abteilungen || []).join(', ')}</td>
                <td>
                  <button onClick={() => edit(r)}>Bearbeiten</button>
                  <button onClick={() => remove(r.mitarbeiter_id)}>Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
