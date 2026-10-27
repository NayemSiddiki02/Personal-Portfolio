const $ = s => document.querySelector(s),
  esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));

const asset = path => location.pathname.split('/').includes('public') ? path : `public/${path}`;

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
      return `<div class="skill-item">${logo ? `<img src="${asset(logo)}" alt="${esc(name)} logo" loading="lazy">` : `<span class="skill-mark" aria-hidden="true">${esc(mark)}</span>`}<span>${esc(name)}</span></div>`;
    }).join('')}</div></article>`;
  }
  let imgs = [x.image, ...String(x.gallery || '').split(/[\n,]+/).map(s => s.trim())].filter(Boolean);
  return `<article class="card">${imgs.length?`<div class="gallery">${imgs.map(i=>`<img src="${esc(asset(i))}" alt="${esc(x.title)}">`).join('')}</div>`:''}<span class="pill">${esc(x.category||'')}</span><h3>${esc(x.title)}</h3>${[x.subtitle,x.dateLabel,x.organization,x.result?'Result: '+x.result:''].filter(Boolean).map(v=>`<p class="meta">${esc(v)}</p>`).join('')}${x.details?`<p>${esc(x.details)}</p>`:''}${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">${['award','certificate'].includes(type)?'SHOW CREDENTIAL ↗':type==='project'?'GITHUB / PROJECT ↗':'VIEW DETAILS ↗'}</a>`:''}</article>`
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
    ? `<img class="experience-logo" src="${esc(asset(item.image))}" alt="${esc(item.organization)} logo">`
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
  $('#portrait').innerHTML = `<img src="${esc(asset(p.photo))}" alt="Profile portrait" onerror="this.outerHTML='<div class=&quot;placeholder&quot;>ADD YOUR<br>PHOTO</div>'">`;
  const professionalMarks = {
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.2 8.4H2V22h3.2V8.4ZM3.6 2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM22 14.2c0-4.1-2.2-6-5.1-6a4.4 4.4 0 0 0-3.9 2.1V8.4H9.8V22H13v-7.2c0-1.9.4-3.7 2.7-3.7s2.3 2.1 2.3 3.8V22h3.2l.8-7.8Z"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .9a11.2 11.2 0 0 0-3.54 21.82c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15 1 1.7 2.61 1.21 3.25.93.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.62 5.24-5.11 5.52.4.35.76 1.03.76 2.08v3.09c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .9Z"/></svg>',
    orcid: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor"/><path fill="var(--paper)" d="M6.1 6.3h2.2v2.2H6.1zm0 3.7h2.2v7.8H6.1zm4.2 0h3.8c3 0 5.3 1.9 5.3 4.4s-2.3 4.4-5.3 4.4h-3.8V10Zm2.2 2v4.8h1.5c1.7 0 3-1 3-2.4s-1.3-2.4-3-2.4h-1.5Z"/></svg>',
    researchgate: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="currentColor"/><text x="3.1" y="17.7" fill="var(--paper)" font-family="Georgia,serif" font-size="16" font-weight="700">R</text><text x="13" y="9.4" fill="var(--paper)" font-family="Georgia,serif" font-size="8" font-weight="700">G</text></svg>'
  };
  $('#professionalSocial').innerHTML = [
    ['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['orcid', 'ORCID'], ['researchgate', 'ResearchGate']
  ].map(([key, name]) => a[key]
    ? `<a href="${esc(a[key])}" target="_blank" rel="noopener noreferrer" aria-label="${name}" title="${name}">${professionalMarks[key]}</a>`
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
    const icon = `<img class="${key === 'x' ? 'social-icon-x' : ''}" src="${asset(`image/${logo}`)}" alt="" aria-hidden="true">`;
    return a[key]
      ? `<a class="social-link" href="${esc(a[key])}" target="_blank" rel="noopener noreferrer" aria-label="${label}" title="${label}">${icon}</a>`
      : `<span class="social-link is-unavailable" aria-label="${label} link not set" title="Add ${label} URL in Admin">${icon}</span>`;
  }).join('');
  const socialFooter = $('#socialFooter');
  if (socialFooter) socialFooter.innerHTML = ['facebook', 'instagram', 'x'].map(k => `<a href="${esc(a[k])}" target="_blank" rel="noopener noreferrer">${k === 'x' ? 'X' : k} ↗</a>`).join('');
  $('#copy').textContent = `© ${new Date().getFullYear()} ${p.name}. All rights reserved.`;
  render('#latest', (d.publication || []).slice(0, 3), 'publication', 'Add publications in Admin.');
  render('#skills', portfolioFile.skills || [], 'skill', 'Add skills in data/portfolio.json.');
  const programmingLanguages = (portfolioFile.skills || [])
    .filter(skill => skill.title === 'Programming Languages')
    .flatMap(skill => String(skill.details || '').split(',').map(name => name.trim()).filter(Boolean));
  const skillCount = new Set(programmingLanguages).size;
  const stats = [
    ['#publicationCount', (d.publication || []).length],
    ['#skillCount', skillCount],
    ['#projectCount', (d.projects || []).length]
  ];
  stats.forEach(([selector, count]) => {
    const element = $(selector);
    element.dataset.count = count;
    element.textContent = '0';
  });
  const statsBar = $('.portfolio-stats');
  if (statsBar && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      stats.forEach(([selector, count]) => {
        const element = $(selector);
        const duration = 1000;
        let start;
        const animate = timestamp => {
          if (start === undefined) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          element.textContent = Math.floor(count * eased);
          if (progress < 1) requestAnimationFrame(animate);
          else element.textContent = count;
        };
        requestAnimationFrame(animate);
      });
    }, { threshold: 0.35 });
    observer.observe(statsBar);
  } else {
    stats.forEach(([selector, count]) => { $(selector).textContent = count; });
  }
  const experienceItems = (portfolioFile.experience || []).slice().sort((a, b) => (b.startDate || b.dateLabel || '').localeCompare(a.startDate || a.dateLabel || ''));
  $('#experienceItems').innerHTML = experienceItems.map(experienceCard).join('') || '<p class="empty">Add experience in data/portfolio.json.</p>';
  const volunteeringItems = (portfolioFile.volunteering || []).slice().sort((a, b) => (b.startDate || b.dateLabel || '').localeCompare(a.startDate || a.dateLabel || ''));
  $('#volunteeringItems').innerHTML = volunteeringItems.map(experienceCard).join('') || '<p class="empty">Add volunteering and activities in data/portfolio.json.</p>';
}
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
$('#theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
});
init().catch(console.error);
