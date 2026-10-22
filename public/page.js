const $ = s => document.querySelector(s),
  e = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));

function card(x, t) {
  let imgs = [x.image, ...String(x.gallery || '').split(',').map(s => s.trim())].filter(Boolean);
  const details = String(x.details || '').split(/\n+/).map(line => line.trim()).filter(Boolean);
  const gallery = t === 'project' && imgs.length > 1
    ? `<div class="project-carousel" data-index="0" data-images="${e(imgs.join('|'))}"><button class="carousel-button previous" type="button" data-move="-1" aria-label="Show previous image">‹</button><img class="carousel-image" src="${e(imgs[0])}" alt="${e(x.title)} image 1 of ${imgs.length}"><button class="carousel-button next" type="button" data-move="1" aria-label="Show next image">›</button><span class="carousel-count">1 / ${imgs.length}</span></div>`
    : imgs.length ? `<div class="gallery ${['award','certificate'].includes(t)?'certificate-gallery':''}">${imgs.map(i=>`<img src="${e(i)}" alt="${e(x.title)} ${t==='project'?'project':'certificate'} image">`).join('')}</div>` : '';
  return `<article class="card">${gallery}${t==='project'&&x.category?`<span class="pill">${e(x.category)}</span>`:''}<h3>${e(x.title)}</h3>${[x.subtitle,x.dateLabel,x.organization,x.result].filter(Boolean).map(v=>`<p class="meta">${e(v)}</p>`).join('')}${details.length?(t==='project'?`<ul class="project-details">${details.map(line=>`<li>${e(line)}</li>`).join('')}</ul>`:`<p>${details.map(e).join(' ')}</p>`):''}${x.url?`<a class="${t==='project'?'project-link':['award','certificate'].includes(t)?'credential-link':''}" target="_blank" rel="noopener" href="${e(x.url)}">${['award','certificate'].includes(t)?'Show Credential ↗':t==='project'?'View project ↗':'VIEW DETAILS ↗'}</a>`:''}</article>`
}

function educationRecord(x) {
  const logo = x.image
    ? `<img class="education-logo" src="${e(x.image)}" alt="${e(x.title)} logo">`
    : '';
  return `<article class="education-record">${logo}<div class="education-details"><h2>${e(x.title)}</h2><p class="education-degree">${e(x.subtitle)}</p><p class="education-date">${e(x.dateLabel)}</p><p class="education-result">${e(x.result)}</p>${x.details ? `<p>${e(x.details)}</p>` : ''}</div></article>`;
}

// Set up the theme before loading page data so the control works even when
// the API is unavailable.
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
$('#theme')?.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
});

document.addEventListener('click', event => {
  const button = event.target.closest('.carousel-button');
  if (!button) return;
  const carousel = button.closest('.project-carousel');
  const image = carousel.querySelector('.carousel-image');
  const count = carousel.querySelector('.carousel-count');
  const total = Number(count.textContent.split('/')[1].trim());
  const current = Number(carousel.dataset.index);
  const next = (current + Number(button.dataset.move) + total) % total;
  const cardTitle = carousel.parentElement.querySelector('h3')?.textContent || 'Project';
  const paths = carousel.dataset.images.split('|');
  carousel.dataset.index = next;
  image.src = paths[next];
  image.alt = `${cardTitle} image ${next + 1} of ${total}`;
  count.textContent = `${next + 1} / ${total}`;
});

async function init() {
  let d = await loadPortfolioData(),
    f = location.pathname.split('/').pop();
  if (f === 'academic.html') $('#items').innerHTML = (d.academic || []).map(educationRecord).join('') || '<p class="empty">Add academic records in Admin.</p>';
  if (f === 'publication.html') $('#items').innerHTML = (d.publication || []).map(x => card(x, 'publication')).join('') || '<p class="empty">Add publications in Admin.</p>';
  if (f === 'projects.html') $('#items').innerHTML = ['AI Project', 'Web Development Project', 'EEE Project'].map(c => `<section><h2 class="subhead">${c}</h2><div class="cards project-cards">${(d.projects||[]).filter(x=>x.category===c).map(x=>card(x,'project')).join('')||'<p class="empty">No projects yet.</p>'}</div></section>`).join('');
  if (f === 'certification.html') {
    $('#awards').innerHTML = (d.awards || []).map(x => card(x, 'award')).join('') || '<p class="empty">No awards added yet.</p>';
    $('#certs').innerHTML = (d.certifications || []).map(x => card(x, 'certificate')).join('') || '<p class="empty">No certificates added yet.</p>'
  }
  if (f === 'contact.html') {
    $('#email').innerHTML = `Email: <a href="mailto:${e(d.profile.email)}">${e(d.profile.email)}</a>`;
    $('#contactForm').onsubmit = ev => {
      ev.preventDefault();
      const fields = Object.fromEntries(new FormData(ev.target));
      const subject = encodeURIComponent(`Portfolio message from ${fields.name}`);
      const body = encodeURIComponent(`Name: ${fields.name}\nEmail: ${fields.email}\n\n${fields.message}`);
      location.href = `mailto:${d.profile.email}?subject=${subject}&body=${body}`;
      $('#status').textContent = 'Your email app should open with the message ready to send.';
    }
  }
}
init();
