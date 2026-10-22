const $ = s => document.querySelector(s),
  esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
$('#theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
});
const ADMIN_USERNAME = 'NayemSiddiki';
const ADMIN_PASSWORD = 'admin490';
const ADMIN_SESSION_KEY = 'portfolio-admin-session';
let data, section = 'publication',
  editId = null;
const types = {
  academic: ['Academic institutions', ['title', 'subtitle', 'dateLabel', 'organization', 'result', 'details', 'image', 'sortOrder']],
  publication: ['Publications', ['title', 'subtitle', 'dateLabel', 'organization', 'details', 'url', 'image', 'sortOrder']],
  projects: ['Projects', ['title', 'category', 'details', 'image', 'gallery', 'url', 'sortOrder']],
  awards: ['Honors & Awards', ['title', 'dateLabel', 'organization', 'details', 'image', 'gallery', 'url', 'sortOrder']],
  certifications: ['Licenses & Certifications', ['title', 'organization', 'dateLabel', 'details', 'image', 'gallery', 'url', 'sortOrder']],
  skills: ['Technical Skills', ['title', 'details', 'sortOrder']],
  interests: ['Research Interests', ['title', 'details', 'sortOrder']],
  experience: ['Experience', ['title', 'organization', 'subtitle', 'dateLabel', 'startDate', 'endDate', 'currentRole', 'location', 'image', 'details', 'sortOrder']]
};
const labels = {
  title: 'Title',
  subtitle: 'Subtitle / degree / role type',
  dateLabel: 'Date / issue date / period',
  organization: 'Organization / institution',
  startDate: 'Start date (month and year)',
  endDate: 'End date (month and year)',
  location: 'Location / work arrangement',
  result: 'Result / GPA',
  details: 'Description / details',
  image: 'Image path (e.g. assets/award.jpg)',
  gallery: 'Gallery images (comma-separated)',
  url: 'External URL / GitHub / credential',
  sortOrder: 'Sort order'
};

function loginView(message = '') {
  $('#app').innerHTML = `<form id="adminLogin" class="login"><h1>Admin login</h1>${message ? `<p class="err">${esc(message)}</p>` : ''}<label>Username<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="solid">SIGN IN ↗</button></form>`;
  $('#adminLogin').onsubmit = event => {
    event.preventDefault();
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    if (credentials.username !== ADMIN_USERNAME || credentials.password !== ADMIN_PASSWORD) {
      loginView('Incorrect username or password.');
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'signed-in');
    open();
  };
}

async function open() {
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== 'signed-in') {
    loginView();
    return;
  }
  try {
    data = await loadPortfolioData();
    data.messages ||= [];
    render();
  } catch (error) {
    $('#app').innerHTML = `<p class="err">${esc(error.message)}. Open this site through a local static web server so the browser can load the JSON file.</p>`;
  }
}

function render() {
  $('#app').innerHTML = `<div class="shell"><aside class="side"><h3>Manage content</h3>${Object.entries(types).map(([k,v])=>`<button data-s="${k}" class="${k===section?'active':''}">${v[0]}</button>`).join('')}<button data-s="profile" class="${section==='profile'?'active':''}">Profile & accounts</button><button id="export">Download JSON</button><button id="import">Import JSON</button><input id="importFile" type="file" accept=".json,application/json" hidden><button id="reset">Reset to file</button><button id="logout">Log out</button></aside><section class="panel" id="panel"></section></div>`;
  $('#logout').onclick = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    loginView();
  };
  document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
    section = b.dataset.s;
    editId = null;
    render()
  });
  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'portfolio.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  $('#import').onclick = () => $('#importFile').click();
  $('#importFile').onchange = async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported.profile || !Array.isArray(imported.projects)) throw Error('This JSON does not look like portfolio data.');
      data = imported;
      savePortfolioData(data);
      render();
    } catch (error) { alert(error.message); }
  };
  $('#reset').onclick = async () => {
    if (!confirm('Discard browser-saved edits and reload the original JSON file?')) return;
    localStorage.removeItem(PORTFOLIO_DATA_KEY);
    data = await loadPortfolioData();
    render();
  };
  section === 'profile' ? profile() : records()
}

function input(k, obj = {}) {
  let v = obj[k] ?? '';
  if (section === 'experience' && k === 'startDate') return `<label>${labels[k]}<input id="startDate" name="startDate" type="month" value="${esc(v)}"></label>`;
  if (section === 'experience' && k === 'endDate') return `<label>${labels[k]}<input id="endDate" name="endDate" type="month" value="${esc(v)}"></label>`;
  if (section === 'experience' && k === 'currentRole') return `<label class="form-check wide"><input id="currentRole" name="currentRole" type="checkbox" ${v ? 'checked' : ''}> I am currently working in this role</label>`;
  if (k === 'category') return `<label>Project category<select name="category">${['AI Project','Web Development Project','EEE Project'].map(x=>`<option ${v===x?'selected':''}>${x}</option>`).join('')}</select></label>`;
  if (k === 'details') return `<label class="wide">${labels[k]}<textarea name="${k}" rows="3">${esc(v)}</textarea></label>`;
  return `<label>${labels[k]||k}<input name="${k}" ${k==='sortOrder'?'type="number"':''} value="${esc(v)}" ${k==='title'?'required':''}></label>`
}
function save() { savePortfolioData(data); }

function records() {
  let [label, fields] = types[section], rows = data[section], obj = rows.find(x => x.id === editId) || {};
  $('#panel').innerHTML = `<h1>${label}</h1><p>Images use paths relative to public/, for example assets/project.jpg. Multiple images can be comma-separated.</p>${section === 'experience' ? '<p>Choose a start month and year. Select the checkbox for a current role; otherwise enter an end month and year.</p>' : ''}<form class="form" id="form"><input type="hidden" name="id" value="${esc(obj.id||'')}"><div class="fields">${fields.map(k=>input(k,obj)).join('')}</div><button class="solid">${editId?'UPDATE ITEM':'ADD ITEM'} ↗</button>${editId?'<button type="button" id="cancel">Cancel</button>':''}</form><div class="records">${rows.map(x=>`<article class="record"><div><h3>${esc(x.title)}</h3><p>${esc(section === 'experience' ? `${x.organization || ''} · ${x.startDate || ''}` : x.subtitle||x.category||x.dateLabel||'')}</p></div><div class="actions"><button data-edit="${esc(x.id)}">Edit</button><button class="del" data-del="${esc(x.id)}">Delete</button></div></article>`).join('')||'<p>No items yet.</p>'}</div>`;
  $('#form').onsubmit = async e => {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.currentTarget)),
      id = f.id || crypto.randomUUID(),
      item = {
        id
      };
    if (section === 'experience') {
      item = {
        id,
        title: f.title.trim(),
        organization: f.organization.trim(),
        subtitle: f.subtitle.trim(),
        dateLabel: f.dateLabel.trim(),
        startDate: f.startDate,
        endDate: f.currentRole ? '' : f.endDate,
        currentRole: Boolean(f.currentRole),
        location: f.location.trim(),
        image: f.image.trim(),
        details: f.details.trim(),
        sortOrder: Number(f.sortOrder || 0)
      };
    } else {
      fields.forEach(k => item[k] = k === 'sortOrder' ? Number(f[k] || 0) : f[k] || '');
    }
    let i = rows.findIndex(x => x.id === id);
    if (i < 0) rows.push(item);
    else rows[i] = item;
    editId = null;
    await save();
    render()
  };
  if (section === 'experience') {
    const currentRole = $('#currentRole');
    const startDate = $('#startDate');
    const endDate = $('#endDate');
    const updateEndDate = () => {
      endDate.disabled = currentRole.checked;
      endDate.required = Boolean(startDate.value) && !currentRole.checked;
      endDate.min = startDate.value || '';
      if (currentRole.checked) endDate.value = '';
    };
    currentRole.addEventListener('change', updateEndDate);
    startDate.addEventListener('change', updateEndDate);
    updateEndDate();
  }
  $('#cancel')?.addEventListener('click', () => {
    editId = null;
    render()
  });
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    editId = b.dataset.edit;
    render()
  });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (confirm('Delete this item?')) {
      data[section] = rows.filter(x => x.id !== b.dataset.del);
      await save();
      render()
    }
  })
}

function profile() {
  let p = data.profile,
    keys = ['linkedin', 'github', 'orcid', 'researchgate', 'codeforces', 'facebook', 'instagram', 'x', 'discord', 'telegram', 'whatsapp'];
  $('#panel').innerHTML = `<h1>Profile & accounts</h1><form class="form" id="pf"><div class="fields"><label>Name<input name="name" value="${esc(p.name)}" required></label><label>Professional role<input name="role" value="${esc(p.role)}"></label><label>Email<input name="email" value="${esc(p.email)}"></label><label>CV path<input name="cv" value="${esc(p.cv)}"></label><label>Photo path<input name="photo" value="${esc(p.photo)}"></label><label class="wide">Introduction<textarea name="intro" rows="4">${esc(p.intro)}</textarea></label>${keys.map(k=>`<label>${k} URL<input name="${k}" value="${esc(p.accounts[k]||'')}"></label>`).join('')}</div><button class="solid">SAVE PROFILE ↗</button></form>`;
  $('#pf').onsubmit = async e => {
    e.preventDefault();
    let f = Object.fromEntries(new FormData(e.currentTarget)),
      {
        name,
        role,
        email,
        cv,
        photo,
        intro,
        ...accounts
      } = f;
    data.profile = {
      name,
      role,
      email,
      cv,
      photo,
      intro,
      accounts
    };
    await save();
    alert('Profile saved')
  }
}

open();
