import { firebaseConfig, firebaseReady } from './firebase-config.js';

const MOVIE_DATA_VERSION = 1;
const MOVIES = { obsession2026: 108 };
const root = document.body;
const movieId = root.dataset.movie || '';
const runtime = Number(root.dataset.runtime || 0);

const xpForLevel = (level) => {
  const n = Math.max(0, Number(level) - 1);
  return Math.floor((50 * n ** 3 - 150 * n ** 2 + 400 * n) / 3);
};
const levelFromXp = (xp) => {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));
const cleanProgress = (progress = {}) => Object.fromEntries(
  Object.entries(MOVIES).map(([id, minutes]) => [id, Math.round(clamp(progress[id], 0, minutes))])
);
const totalXp = (progress) => Object.values(cleanProgress(progress)).reduce((sum, value) => sum + value, 0);

let auth;
let db;
let api;
let currentUser = null;
let profile = null;

const authArea = document.querySelector('#authArea');
const watchedButton = document.querySelector('#watchedButton');
const movieSaveStatus = document.querySelector('#movieSaveStatus');

document.body.insertAdjacentHTML('beforeend', `
  <div class="modal" id="authModal" hidden>
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <button class="modal-close" type="button" data-close aria-label="Fechar">×</button>
      <h2 id="authTitle">Entrar</h2>
      <p id="authLead">Acesse sua conta para salvar seus minutos e XP.</p>
      <form id="authForm">
        <label id="nickField" hidden>Apelido<input id="authNick" autocomplete="nickname" maxlength="24"></label>
        <label>E-mail<input id="authEmail" type="email" autocomplete="email" required></label>
        <label>Senha<input id="authPassword" type="password" autocomplete="current-password" minlength="6" required></label>
        <button class="button primary" id="authSubmit" type="submit">Entrar</button>
      </form>
      <button class="button google" id="googleLogin" type="button">Continuar com Google</button>
      <button class="text-button" id="authToggle" type="button">Criar uma conta</button>
      <p class="status" id="authStatus"></p>
    </section>
  </div>
  <div class="modal" id="profileModal" hidden>
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
      <button class="modal-close" type="button" data-close aria-label="Fechar">×</button>
      <h2 id="profileTitle">Minha conta</h2>
      <p id="profileEmail"></p>
      <div class="profile-summary">
        <div><span>Nível</span><strong id="profileLevel">1</strong></div>
        <div><span>Experiência</span><strong id="profileXp">0 XP</strong></div>
        <div><span>Minutos assistidos</span><strong id="profileMinutes">0</strong></div>
      </div>
      <button class="button" id="logoutButton" type="button">Sair da conta</button>
    </section>
  </div>`);

const authModal = document.querySelector('#authModal');
const profileModal = document.querySelector('#profileModal');
const authForm = document.querySelector('#authForm');
const authStatus = document.querySelector('#authStatus');
let registerMode = false;

function showStatus(element, message, type = '') {
  if (!element) return;
  element.textContent = message;
  element.className = `status ${type}`.trim();
}
function openModal(modal) { modal.hidden = false; }
function closeModals() { document.querySelectorAll('.modal').forEach((modal) => { modal.hidden = true; }); }

function renderMovieProgress() {
  if (!movieId || !watchedButton) return;
  const minutes = profile?.movieProgress?.[movieId] || 0;
  watchedButton.classList.toggle('watched', minutes >= runtime);
  showStatus(movieSaveStatus, minutes >= runtime ? 'Salvo no seu perfil.' : '', minutes >= runtime ? 'ok' : '');
}

function renderProfilePage() {
  if (root.dataset.page !== 'profile') return;
  const content = document.querySelector('#profileContent');
  const gate = document.querySelector('#profileGate');
  content.hidden = !currentUser || !profile;
  gate.hidden = Boolean(currentUser && profile);
  if (!currentUser || !profile) return;
  const xp = Number(profile.xp) || 0;
  const level = Number(profile.level) || 1;
  const next = xpForLevel(level + 1);
  const start = xpForLevel(level);
  const percent = clamp(((xp - start) / (next - start)) * 100, 0, 100);
  const nick = profile.nick || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário';
  const minutes = profile.movieProgress?.obsession2026 || 0;
  document.querySelector('#pageAvatar').textContent = nick.charAt(0).toUpperCase();
  document.querySelector('#pageNick').textContent = nick;
  document.querySelector('#pageEmail').textContent = currentUser.email || '';
  document.querySelector('#pageLevel').textContent = level;
  document.querySelector('#pageXp').textContent = `${xp} XP`;
  document.querySelector('#pageMinutes').textContent = totalXp(profile.movieProgress);
  document.querySelector('#nextLevelText').textContent = `${xp - start} / ${next - start} XP`;
  document.querySelector('#levelProgress').style.width = `${percent}%`;
  document.querySelector('#historyProgress').textContent = `${minutes} de 108 minutos`;
  document.querySelector('#historyXp').textContent = `${minutes} XP`;
  document.querySelector('#historyBar').style.width = `${(minutes / 108) * 100}%`;
}

function renderAccount() {
  if (!currentUser || !profile) {
    authArea.innerHTML = '<button class="auth-button" id="openLogin" type="button">Entrar</button>';
    document.querySelector('#openLogin').addEventListener('click', () => openModal(authModal));
    renderMovieProgress();
    renderProfilePage();
    return;
  }
  const xp = Number(profile.xp) || 0;
  const level = Number(profile.level) || 1;
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const percent = end === start ? 100 : clamp(((xp - start) / (end - start)) * 100, 0, 100);
  const nick = profile.nick || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário';
  authArea.innerHTML = `<button class="header-profile" id="openProfile" type="button"><span class="profile-avatar">${escapeHtml(nick.charAt(0).toUpperCase())}</span><span class="header-profile-info"><span><strong>${escapeHtml(nick)}</strong><b>Nível ${level}</b></span><i class="header-xp-track"><i style="width:${percent}%"></i></i><small>${xp} XP</small></span></button>`;
  document.querySelector('#openProfile').addEventListener('click', () => {
    window.location.href = root.dataset.page === 'movie' ? '../../perfil.html' : 'perfil.html';
  });
  renderMovieProgress();
  renderProfilePage();
}

async function saveProfile(movieProgress, extra = {}) {
  const normalized = cleanProgress(movieProgress);
  const xp = totalXp(normalized);
  const data = {
    uid: currentUser.uid,
    email: currentUser.email || '',
    nick: profile?.nick || currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuário',
    animeProgress: {},
    movieProgress: normalized,
    xp,
    level: levelFromXp(xp),
    movieDataVersion: MOVIE_DATA_VERSION,
    updatedAt: api.serverTimestamp(),
    ...extra
  };
  await api.setDoc(api.doc(db, 'users', currentUser.uid), data, { merge: true });
  profile = { ...profile, ...data };
  renderAccount();
}

async function loadProfile(user) {
  const reference = api.doc(db, 'users', user.uid);
  const snapshot = await api.getDoc(reference);
  const existing = snapshot.exists() ? snapshot.data() : {};
  profile = existing;
  if (existing.movieDataVersion !== MOVIE_DATA_VERSION) {
    profile = { ...existing, nick: existing.nick || user.displayName || user.email?.split('@')[0] || 'Usuário' };
    await saveProfile({}, { createdAt: existing.createdAt || api.serverTimestamp() });
  } else {
    await saveProfile(existing.movieProgress || {});
  }
}

async function initialize() {
  if (!firebaseReady) {
    showStatus(authStatus, 'O login está temporariamente indisponível.', 'error');
    renderAccount();
    return;
  }
  try {
    const [appModule, authModule, storeModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    ]);
    api = { ...authModule, ...storeModule };
    const app = appModule.initializeApp(firebaseConfig);
    auth = authModule.getAuth(app);
    db = storeModule.getFirestore(app);
    authModule.onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      profile = null;
      if (user) {
        try { await loadProfile(user); } catch (error) { showStatus(authStatus, 'Não foi possível carregar sua conta.', 'error'); }
      }
      renderAccount();
    });
  } catch (error) {
    showStatus(authStatus, 'Não foi possível iniciar o login.', 'error');
    renderAccount();
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!auth) return showStatus(authStatus, 'Aguarde o login carregar.', 'error');
  const email = document.querySelector('#authEmail').value.trim();
  const password = document.querySelector('#authPassword').value;
  const nick = document.querySelector('#authNick').value.trim();
  showStatus(authStatus, 'Aguarde…');
  try {
    if (registerMode) {
      const credential = await api.createUserWithEmailAndPassword(auth, email, password);
      currentUser = credential.user;
      profile = { nick: nick || email.split('@')[0] };
      await saveProfile({}, { createdAt: api.serverTimestamp() });
    } else {
      await api.signInWithEmailAndPassword(auth, email, password);
    }
    closeModals();
    authForm.reset();
  } catch (error) { showStatus(authStatus, 'Confira seus dados e tente novamente.', 'error'); }
});

document.querySelector('#googleLogin').addEventListener('click', async () => {
  if (!auth) return showStatus(authStatus, 'Aguarde o login carregar.', 'error');
  try { await api.signInWithPopup(auth, new api.GoogleAuthProvider()); closeModals(); }
  catch (error) { showStatus(authStatus, 'Não foi possível entrar com o Google.', 'error'); }
});
document.querySelector('#authToggle').addEventListener('click', () => {
  registerMode = !registerMode;
  document.querySelector('#authTitle').textContent = registerMode ? 'Criar conta' : 'Entrar';
  document.querySelector('#authLead').textContent = registerMode ? 'Comece no nível 1, com 0 XP.' : 'Acesse sua conta para salvar seus minutos e XP.';
  document.querySelector('#nickField').hidden = !registerMode;
  document.querySelector('#authSubmit').textContent = registerMode ? 'Criar conta' : 'Entrar';
  document.querySelector('#authToggle').textContent = registerMode ? 'Já tenho uma conta' : 'Criar uma conta';
  showStatus(authStatus, '');
});
document.querySelector('#logoutButton').addEventListener('click', async () => { await api.signOut(auth); closeModals(); });
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', closeModals));
document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModals(); }));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModals(); });

watchedButton?.addEventListener('click', async () => {
  if (!currentUser) { openModal(authModal); return; }
  try {
    watchedButton.disabled = true;
    showStatus(movieSaveStatus, 'Salvando…');
    await saveProfile({ ...profile.movieProgress, [movieId]: runtime });
    showStatus(movieSaveStatus, `Salvo no seu perfil: ${runtime} XP.`, 'ok');
  } catch (error) {
    showStatus(movieSaveStatus, 'Não foi possível salvar. Tente novamente.', 'error');
  } finally { watchedButton.disabled = false; }
});

renderAccount();
document.querySelector('#profileLogin')?.addEventListener('click', () => openModal(authModal));
document.querySelector('#pageLogout')?.addEventListener('click', async () => { if (auth) await api.signOut(auth); });
initialize();
