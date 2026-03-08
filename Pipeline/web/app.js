const API_BASE = 'http://127.0.0.1:8787';

const projectListEl = document.getElementById('projectList');
const detailsEl = document.getElementById('details');
const refreshBtn = document.getElementById('refreshBtn');
const createProjectForm = document.getElementById('createProjectForm');
const addStepForm = document.getElementById('addStepForm');
const filterForm = document.getElementById('filterForm');

let projects = [];
let selectedId = null;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

async function fetchProjects() {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to load projects');
  const data = await res.json();
  projects = data.projects || [];
  if (!selectedId && projects.length) selectedId = projects[0].id;
  if (selectedId && !projects.find(p => p.id === selectedId)) selectedId = projects[0]?.id || null;
  renderProjects();
  renderDetails();
}

function getFilteredProjects() {
  const form = new FormData(filterForm);
  const status = String(form.get('status') || '');
  const importanceMax = Number(form.get('importanceMax') || 0);
  const criticalOnly = form.get('criticalOnly') === 'on';

  return projects.filter((p) => {
    if (status && p.status !== status) return false;
    if (importanceMax && Number(p.importance) > importanceMax) return false;
    if (criticalOnly && !p.critical) return false;
    return true;
  });
}

function renderProjects() {
  const visible = getFilteredProjects();
  if (!visible.length) {
    projectListEl.innerHTML = '<li class="meta">No projects for current filters.</li>';
    return;
  }
  projectListEl.innerHTML = visible.map((p) => `
    <li class="card ${p.id === selectedId ? 'active' : ''}" data-id="${p.id}">
      <div class="name">${esc(p.name)} ${p.critical ? '<span class="badge critical">CRITICAL</span>' : ''}</div>
      <div class="meta">importance=${p.importance} · status=${esc(p.status)}</div>
      <div class="meta">updated=${esc(p.lastUpdated || p.updatedAt || '')}</div>
    </li>
  `).join('');

  document.querySelectorAll('.card').forEach((el) => {
    el.addEventListener('click', () => {
      selectedId = el.dataset.id;
      renderProjects();
      renderDetails();
    });
  });
}

function renderDetails() {
  const p = projects.find((x) => x.id === selectedId);
  if (!p) {
    addStepForm.style.display = 'none';
    detailsEl.innerHTML = '<p class="meta">Select a project.</p>';
    return;
  }

  addStepForm.style.display = 'grid';

  const steps = (p.steps || []).map((s) => `
    <div class="step">
      <div><strong>${esc(s.title)}</strong> <span class="badge">${esc(s.status)}</span></div>
      <div class="meta">${esc(s.description || '')}</div>
      <div class="meta">lastUpdated=${esc(s.lastUpdated || s.updatedAt || '')}</div>
    </div>
  `).join('') || '<p class="meta">No steps yet.</p>';

  detailsEl.innerHTML = `
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.description || '')}</p>
    <p class="meta">
      id=${esc(p.id)} · importance=${esc(p.importance)} · status=${esc(p.status)}
      ${p.critical ? '· CRITICAL' : ''}
    </p>
    <p class="meta">currentStep=${esc(p.currentStep || 'none')} · blockedReason=${esc(p.blockedReason || '')}</p>
    <h4>Steps</h4>
    ${steps}
  `;
}

refreshBtn.addEventListener('click', fetchProjects);

createProjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(createProjectForm);
  const payload = {
    name: String(form.get('name') || '').trim(),
    description: String(form.get('description') || '').trim(),
    importance: Number(form.get('importance') || 3),
  };
  if (!payload.name) return;

  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    alert(`Create project failed: ${msg}`);
    return;
  }
  createProjectForm.reset();
  await fetchProjects();
});

filterForm.addEventListener('change', () => {
  renderProjects();
  renderDetails();
});

addStepForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedId) return;

  const form = new FormData(addStepForm);
  const payload = {
    title: String(form.get('title') || '').trim(),
    description: String(form.get('description') || '').trim(),
  };
  if (!payload.title) return;

  const res = await fetch(`${API_BASE}/projects/${selectedId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text();
    alert(`Add step failed: ${msg}`);
    return;
  }
  addStepForm.reset();
  await fetchProjects();
});

fetchProjects().catch((err) => {
  detailsEl.innerHTML = `<pre>${esc(err.message)}\n\nMake sure Pipeline API is running on ${API_BASE}</pre>`;
});
