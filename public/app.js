const $ = s => document.querySelector(s),
  esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));

function card(x, type = '') {
  if (type === 'skill') {
    const logoFiles = {
      'C': 'image/clogo.png',
      'C++': 'image/cpp.png',
      'Java': 'image/javalogo.png',
      'C#': 'image/cserplogo.png',
      'Python': 'image/python.png',
      'Assembly Language': 'image/assembly.png',
      'MATLAB': 'image/Matlab_Logo.png',
      'Jupyter Notebook': 'image/Jupyter_logo.png',
      'Multisim': 'image/multisim_logo.png',
      'Arduino IDE': 'image/arduino_logo.png',
      'Proteus': 'image/Proteus_logo.png',
      'AutoCAD 2007': 'image/AutoCAD_2007.png',
      'Cisco Packet Tracer': 'image/Cisco_Packet_Tracer.png',
      'XAMPP': 'image/XAMPP.png',
      'MySQL': 'image/MySQL-Logo.png',
      'Microsoft MySQL': 'image/MySQL-Logo.png',
      'HTML': 'image/html5.png',
      'CSS': 'image/css3.png',
      'JavaScript': 'image/javascript.png',
      'PHP': 'image/php_logo.png'
    };
    const items = String(x.details || '').split(',').map(name => name.trim()).filter(Boolean);
    return `<article class="card skill-card"><h3>${esc(x.title)}</h3><div class="skill-logos">${items.map(name => {
      const logo = logoFiles[name];
      const mark = name === 'Assembly Language' ? 'ASM' : name.split(/\s+/).map(part => part[0]).join('').slice(0, 3).toUpperCase();
      return `<div class="skill-item">${logo ? `<img src="${logo}" alt="${esc(name)} logo" loading="lazy">` : `<span class="skill-mark" aria-hidden="true">${esc(mark)}</span>`}<span>${esc(name)}</span></div>`;
    }).join('')}</div></article>`;
  }
  let imgs = [x.image, ...String(x.gallery || '').split(/[\n,]+/).map(s => s.trim())].filter(Boolean);
  return `<article class="card">${imgs.length?`<div class="gallery">${imgs.map(i=>`<img src="${esc(i)}" alt="${esc(x.title)}">`).join('')}</div>`:''}<span class="pill">${esc(x.category||'')}</span><h3>${esc(x.title)}</h3>${[x.subtitle,x.dateLabel,x.organization,x.result?'Result: '+x.result:''].filter(Boolean).map(v=>`<p class="meta">${esc(v)}</p>`).join('')}${x.details?`<p>${esc(x.details)}</p>`:''}${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">${['award','certificate'].includes(type)?'SHOW CREDENTIAL ↗':type==='project'?'GITHUB / PROJECT ↗':'VIEW DETAILS ↗'}</a>`:''}</article>`
}

function render(id, rows, type, empty) {
  let e = $(id);
  if (e) e.innerHTML = rows?.length ? rows.map(x => card(x, type)).join('') : `<p class="empty">${empty}</p>`
}

function parseMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value || '')) return null;
  const [year, month] = value.split('-').map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function formatDuration(months) {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  if (remainingMonths || !years) parts.push(`${remainingMonths} ${remainingMonths === 1 ? 'mo' : 'mos'}`);
  return parts.join(' ');
}

function experienceCard(item) {
  const start = parseMonth(item.startDate);
  const now = new Date();
  const end = item.currentRole
    ? new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    : parseMonth(item.endDate);
  if ((!start || !end) && !item.dateLabel) return '';

  const durationMonths = start && end ? Math.max(1, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth() + 1) : 0;
  const status = item.currentRole ? 'Present' : item.subtitle === 'Volunteer' ? 'Volunteer' : 'Past';
  const dateRange = item.dateLabel || `${formatMonth(start)} – ${item.currentRole ? 'Present' : formatMonth(end)} · ${formatDuration(durationMonths)}`;
  const logo = item.image
    ? `<img class="experience-logo" src="${esc(item.image)}" alt="${esc(item.organization)} logo">`
    : `<div class="experience-logo experience-wordmark" aria-hidden="true">${esc((item.organization || '?').slice(0, 2).toUpperCase())}</div>`;

  return `<article class="experience-item">${logo}<div class="experience-details"><span class="experience-status">${status}</span><h3>${esc(item.title)}</h3><p class="experience-organization">${esc(item.organization)}${item.subtitle ? ` · ${esc(item.subtitle)}` : ''}</p><p class="experience-meta">${dateRange}</p>${item.location ? `<p class="experience-meta">${esc(item.location)}</p>` : ''}${item.details ? `<p>${esc(item.details)}</p>` : ''}</div></article>`;
}

async function init() {
  let d = await loadPortfolioData();
  const portfolioFile = await loadFilePortfolioData();
  const p = d.profile;
  const a = p.accounts;
  $('#logo').innerHTML = esc(p.name.split(/\s+/)[0]) + '<span>' + esc(p.name.split(/\s+/).slice(1).join('')) + '</span>';
  $('#footerLogo').innerHTML = $('#logo').innerHTML;
  $('#name').textContent = p.name.toUpperCase();
  $('#role').textContent = p.role.toUpperCase();
  $('#intro').outerHTML = String(p.intro || '').split(/(?:\r?\n|\/n)/i).map(paragraph => paragraph.trim()).filter(Boolean)
    .map((paragraph, index) => `<p id="intro${index ? `-${index + 1}` : ''}" class="lead">${esc(paragraph)}</p>`).join('');
  $('#cv').href = p.cv;
  $('#portrait').innerHTML = `<img src="${esc(p.photo)}" alt="Profile portrait" onerror="this.outerHTML='<div class=&quot;placeholder&quot;>ADD YOUR<br>PHOTO</div>'">`;
  $('#professionalSocial').innerHTML = [
    ['linkedin', 'LinkedIn', 'LinkedIn_icon.png'],
    ['github', 'GitHub', 'github_logo.png'],
    ['orcid', 'ORCID', 'ORCID_iD.png'],
    ['researchgate', 'ResearchGate', 'ResearchGate_icon.png']
  ].map(([key, name, logo]) => a[key]
    ? `<a href="${esc(a[key])}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}"><img src="image/${logo}" alt=""></a>`
    : '').join('');
  const socialLinks = {
    facebook: ['Facebook', 'fb_logo.png'],
    instagram: ['Instagram', 'Instagram_logo.png'],
    x: ['X', 'x-logo.svg'],
    discord: ['Discord', 'discord-logo.png'],
    telegram: ['Telegram', 'Telegram_Logo.png'],
    whatsapp: ['WhatsApp', 'whatsapp-icon.png']
  };
  $('#heroSocial').innerHTML = Object.entries(socialLinks).map(([key, [label, logo]]) => {
    const icon = `<img class="${key === 'x' ? 'social-icon-x' : ''}" src="image/${logo}" alt="" aria-hidden="true">`;
    return a[key]
      ? `<a class="social-link" href="${esc(a[key])}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon}</a>`
      : `<span class="social-link is-unavailable" aria-label="${label} link not set" title="Add ${label} URL in Admin">${icon}</span>`;
  }).join('');
  const socialFooter = $('#socialFooter');
  if (socialFooter) socialFooter.innerHTML = ['facebook', 'instagram', 'x'].map(k => `<a href="${esc(a[k])}" target="_blank" rel="noopener noreferrer">${k === 'x' ? 'X' : k} ↗</a>`).join('');
  $('#copy').textContent = `© ${new Date().getFullYear()} ${p.name}. All rights reserved.`;
  render('#latest', (d.publication || []).slice(0, 3), 'publication', 'Add publications in Admin.');
  render('#skills', portfolioFile.skills || [], 'skill', 'Add skills in data/portfolio.json.');
  const experienceItems = (portfolioFile.experience || []).slice().sort((a, b) => (b.startDate || b.dateLabel || '').localeCompare(a.startDate || a.dateLabel || ''));
  $('#experienceItems').innerHTML = experienceItems.map(experienceCard).join('') || '<p class="empty">Add experience in data/portfolio.json.</p>';
}
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
$('#theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
});
init().catch(console.error);
