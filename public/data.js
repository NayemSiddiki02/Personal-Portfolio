// Browser-only data access. Admin edits stay in this browser until exported.
const PORTFOLIO_DATA_KEY = 'portfolio-data';

async function loadFilePortfolioData() {
  const response = await fetch(location.pathname.split('/').includes('public') ? '../data/portfolio.json' : 'data/portfolio.json');
  if (!response.ok) throw new Error('Could not load data/portfolio.json');
  return response.json();
}

async function loadPortfolioData() {
  const saved = localStorage.getItem(PORTFOLIO_DATA_KEY);
  if (!saved) return loadFilePortfolioData();

  const data = JSON.parse(saved);
  // A browser-saved copy from an older version may not have experience entries.
  if (!Array.isArray(data.experience) || data.experience.length === 0) {
    try {
      const fileData = await loadFilePortfolioData();
      if (fileData.experience?.length) data.experience = fileData.experience;
    } catch {
      // Continue with saved content if the JSON file is unavailable.
    }
  }
  return data;
}

function savePortfolioData(data) {
  localStorage.setItem(PORTFOLIO_DATA_KEY, JSON.stringify(data));
}
