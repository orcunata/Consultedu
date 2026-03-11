// ===== Auth State =====
let currentUser = null;
let authToken = localStorage.getItem('pusula_token');

// ===== DOM Elements =====
const authForms = document.getElementById('auth-forms');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const submitSection = document.getElementById('submit-section');
const loginForm = document.getElementById('login');
const registerForm = document.getElementById('register');
const loginFormDiv = document.getElementById('login-form');
const registerFormDiv = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');
const submitFeatureForm = document.getElementById('submit-feature');
const featuresContainer = document.getElementById('features-container');
const featuresEmpty = document.getElementById('features-empty');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

// ===== API Helpers =====
async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = 'Bearer ' + authToken;
  }
  const res = await fetch('/api/' + endpoint, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ===== Auth Toggle =====
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginFormDiv.hidden = true;
  registerFormDiv.hidden = false;
  loginError.hidden = true;
  registerError.hidden = true;
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerFormDiv.hidden = true;
  loginFormDiv.hidden = false;
  loginError.hidden = true;
  registerError.hidden = true;
});

// ===== Login =====
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    authToken = data.token;
    localStorage.setItem('pusula_token', authToken);
    currentUser = data.user;
    updateAuthUI();
    loadFeatures();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

// ===== Register =====
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.hidden = true;
  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const data = await api('register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value
      })
    });
    authToken = data.token;
    localStorage.setItem('pusula_token', authToken);
    currentUser = data.user;
    updateAuthUI();
    loadFeatures();
  } catch (err) {
    registerError.textContent = err.message;
    registerError.hidden = false;
  } finally {
    btn.disabled = false;
  }
});

// ===== Logout =====
logoutBtn.addEventListener('click', () => {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('pusula_token');
  updateAuthUI();
  loadFeatures();
});

// ===== Auth UI =====
function updateAuthUI() {
  if (currentUser) {
    authForms.hidden = true;
    userInfo.hidden = false;
    userName.textContent = currentUser.name;
    submitSection.hidden = false;
  } else {
    authForms.hidden = false;
    userInfo.hidden = true;
    submitSection.hidden = true;
    loginFormDiv.hidden = false;
    registerFormDiv.hidden = true;
  }
}

// ===== Check Session =====
async function checkSession() {
  if (!authToken) return;
  try {
    const data = await api('me');
    currentUser = data.user;
    updateAuthUI();
  } catch {
    authToken = null;
    localStorage.removeItem('pusula_token');
  }
}

// ===== Submit Feature Request =====
submitFeatureForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = submitFeatureForm.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    await api('features', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('feature-title').value,
        description: document.getElementById('feature-desc').value
      })
    });
    submitFeatureForm.reset();
    loadFeatures();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
});

// ===== Load Features =====
async function loadFeatures() {
  try {
    const data = await api('features');
    renderFeatures(data.features);
  } catch {
    featuresContainer.innerHTML = '<p class="features-error">Failed to load features.</p>';
  }
}

// ===== Render Features =====
function renderFeatures(features) {
  if (!features || features.length === 0) {
    featuresEmpty.hidden = false;
    featuresContainer.innerHTML = '';
    return;
  }

  featuresEmpty.hidden = true;
  featuresContainer.innerHTML = features.map(f => `
    <div class="feature-card">
      <button class="vote-btn ${f.user_voted ? 'voted' : ''}" data-id="${f.id}" ${!currentUser ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
        <span class="vote-count">${f.vote_count}</span>
      </button>
      <div class="feature-content">
        <h3 class="feature-title">${escapeHtml(f.title)}</h3>
        ${f.description ? `<p class="feature-desc">${escapeHtml(f.description)}</p>` : ''}
        <span class="feature-meta">${escapeHtml(f.author_name)} &middot; ${formatDate(f.created_at)}</span>
      </div>
    </div>
  `).join('');

  // Attach vote handlers
  featuresContainer.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn));
  });
}

// ===== Vote =====
async function handleVote(btn) {
  if (!currentUser) return;
  const featureId = parseInt(btn.dataset.id);
  btn.disabled = true;

  // Optimistic UI
  const countEl = btn.querySelector('.vote-count');
  const wasVoted = btn.classList.contains('voted');
  const oldCount = parseInt(countEl.textContent);
  btn.classList.toggle('voted');
  countEl.textContent = wasVoted ? oldCount - 1 : oldCount + 1;

  try {
    await api('vote', {
      method: 'POST',
      body: JSON.stringify({ feature_id: featureId })
    });
  } catch {
    // Revert on error
    btn.classList.toggle('voted');
    countEl.textContent = oldCount;
  } finally {
    btn.disabled = false;
  }
}

// ===== Utilities =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== Language Toggle (reuse from i18n.js) =====
document.getElementById('lang-toggle').addEventListener('click', () => {
  const currentLang = localStorage.getItem('lang') || 'tr';
  const newLang = currentLang === 'tr' ? 'en' : 'tr';
  localStorage.setItem('lang', newLang);
  setLanguage(newLang);
  document.getElementById('lang-toggle').querySelector('.lang-flag').textContent = newLang === 'tr' ? 'EN' : 'TR';
});

// ===== Init =====
(async function init() {
  // Set language
  const lang = localStorage.getItem('lang') || 'tr';
  if (typeof setLanguage === 'function') {
    setLanguage(lang);
  }
  document.getElementById('lang-toggle').querySelector('.lang-flag').textContent = lang === 'tr' ? 'EN' : 'TR';

  await checkSession();
  loadFeatures();
})();
