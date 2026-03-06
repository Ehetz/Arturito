const rowsEl = document.getElementById('rows');
const statusEl = document.getElementById('status');

function render(rows) {
  rowsEl.innerHTML = rows
    .map((r) => `
      <tr>
        <td>${r.nachname ?? ''}</td>
        <td>${r.vorname ?? ''}</td>
        <td>${r.mobil_buero ?? ''}</td>
        <td>
          <div class="tags">
            ${(r.abteilungen || []).map((d) => `<span class="tag">${d}</span>`).join('')}
          </div>
        </td>
      </tr>
    `)
    .join('');
}

async function load() {
  const r = await fetch('/api/mitarbeiter/public-info');
  const data = await r.json();
  render(data);
  statusEl.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE')}`;
}

load();

const es = new EventSource('/api/mitarbeiter/stream');
es.onmessage = async () => {
  await load();
};
es.onerror = () => {
  statusEl.textContent = 'Verbindung unterbrochen – erneuter Versuch...';
};
