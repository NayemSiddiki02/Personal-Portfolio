// Browser-only data access. Admin edits stay in this browser until exported.
const PORTFOLIO_DATA_KEY = 'portfolio-data';

async function loadFilePortfolioData() {
  const dataPath = location.pathname.split('/').includes('public') ? '../data/' : 'data/';
  const files = ['portfolio.json', 'projects.json', 'certifications.json', 'awards.json'];
  const responses = await Promise.all(files.map(file => fetch(`${dataPath}${file}`)));
  const failed = responses.findIndex(response => !response.ok);
  if (failed !== -1) throw new Error(`Could not load ${dataPath}${files[failed]}`);
  const [portfolio, projects, certifications, awards] = await Promise.all(responses.map(response => response.json()));
  return { ...portfolio, projects, certifications, awards };
}

async function loadPortfolioData() {
  const saved = localStorage.getItem(PORTFOLIO_DATA_KEY);
  if (!saved) return loadFilePortfolioData();

  const data = JSON.parse(saved);
  let migrated = false;
  if (!Array.isArray(data.volunteering)) {
    data.volunteering = [];
    const legacyVolunteers = (data.experience || []).filter(item => item.subtitle === 'Volunteer');
    if (legacyVolunteers.length) {
      data.volunteering.push(...legacyVolunteers);
      data.experience = data.experience.filter(item => item.subtitle !== 'Volunteer');
    }
    migrated = true;
  }
  // Remove this retired group from browser-saved copies created before its removal.
  if (Array.isArray(data.skills)) {
    const skills = data.skills.filter(skill => skill.title !== 'Tools & Platforms');
    if (skills.length !== data.skills.length) {
      data.skills = skills;
      migrated = true;
    }
  }
  // A browser-saved copy from an older version may not have experience entries.
  if (!Array.isArray(data.experience) || data.experience.length === 0) {
    try {
      const fileData = await loadFilePortfolioData();
      if (fileData.experience?.length) data.experience = fileData.experience;
    } catch {
      // Continue with saved content if the JSON file is unavailable.
    }
  }
  if (migrated) savePortfolioData(data);
  return data;
}

function savePortfolioData(data) {
  localStorage.setItem(PORTFOLIO_DATA_KEY, JSON.stringify(data));
}
