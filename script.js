import { firebaseConfig, firebaseReady } from './firebase-config.js';

const MOVIE_DATA_VERSION = 1;
const MOVIE_CATALOG = {
  obsession2026: { title: 'Obsessão', runtime: 108, year: 2026, href: 'Filmes/Obsessao%202026/obsessao-2026.html', image: 'Filmes/Obsessao%202026/obsessao-2026-hd.jpg' },
  supergirl2026: { title: 'Supergirl', runtime: 108, year: 2026, href: 'Filmes/Supergirl%202026/supergirl-2026.html', image: 'Filmes/Supergirl%202026/supergirl-2026-hd.webp' },
  avatarAang2026: { title: 'Avatar Aang: O Último Mestre de Ar', runtime: 99, year: 2026, href: 'Filmes/Avatar%20Aang%20O%20Ultimo%20Mestre%20de%20Ar%202026/avatar-aang-2026.html', image: 'Filmes/Avatar%20Aang%20O%20Ultimo%20Mestre%20de%20Ar%202026/avatar-aang-2026-hd.webp' },
  mastersUniverse2026: { title: 'Mestres do Universo', runtime: 140, year: 2026, href: 'Filmes/Mestres%20do%20Universo%202026/mestres-do-universo-2026.html', image: 'Filmes/Mestres%20do%20Universo%202026/mestres-do-universo-2026-hd.webp' },
  interstellar2014: { title: 'Interestelar', runtime: 169, year: 2014, href: 'Filmes/Interestelar%202014/interestelar-2014.html', image: 'Filmes/Interestelar%202014/interestelar-2014-hd.jpg' },
  parasite2019: { title: 'Parasita', runtime: 132, year: 2019, href: 'Filmes/Parasita%202019/parasita-2019.html', image: 'Filmes/Parasita%202019/parasita-2019-hd.jpg' },
  godfather1972: { title: 'O Poderoso Chefão', runtime: 175, year: 1972, href: 'Filmes/O%20Poderoso%20Chefao%201972/o-poderoso-chefao-1972.html', image: 'Filmes/O%20Poderoso%20Chefao%201972/o-poderoso-chefao-1972-hd.jpg' },
  spiritedAway2001: { title: 'A Viagem de Chihiro', runtime: 125, year: 2001, href: 'Filmes/A%20Viagem%20de%20Chihiro%202001/a-viagem-de-chihiro-2001.html', image: 'Filmes/A%20Viagem%20de%20Chihiro%202001/a-viagem-de-chihiro-2001-hd.jpg' },
  madMax2015: { title: 'Mad Max: Estrada da Fúria', runtime: 120, year: 2015, href: 'Filmes/Mad%20Max%20Estrada%20da%20Furia%202015/mad-max-estrada-da-furia-2015.html', image: 'Filmes/Mad%20Max%20Estrada%20da%20Furia%202015/mad-max-estrada-da-furia-2015-hd.jpg' }
};
const MOVIES = Object.fromEntries(Object.entries(MOVIE_CATALOG).map(([id, movie]) => [id, movie.runtime]));
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
const normalizeText = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
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
  document.querySelector('#pageAvatar').textContent = nick.charAt(0).toUpperCase();
  document.querySelector('#pageNick').textContent = nick;
  document.querySelector('#pageEmail').textContent = currentUser.email || '';
  document.querySelector('#pageLevel').textContent = level;
  document.querySelector('#pageXp').textContent = `${xp} XP`;
  document.querySelector('#pageMinutes').textContent = totalXp(profile.movieProgress);
  document.querySelector('#nextLevelText').textContent = `${xp - start} / ${next - start} XP`;
  document.querySelector('#levelProgress').style.width = `${percent}%`;
  const watched = Object.entries(MOVIE_CATALOG).filter(([id, movie]) => (profile.movieProgress?.[id] || 0) >= movie.runtime);
  const historyList = document.querySelector('#historyList');
  historyList.innerHTML = watched.length ? watched.map(([id, movie]) => `<a class="history-movie" href="${movie.href}"><img src="${movie.image}" alt="Capa de ${escapeHtml(movie.title)}"><div><h3>${escapeHtml(movie.title)}</h3><p>${movie.runtime} minutos assistidos</p><div class="progress-track"><i style="width:100%"></i></div></div><strong>${movie.runtime} XP</strong></a>`).join('') : '<p class="empty-history">Você ainda não marcou nenhum filme como assistido.</p>';
}

function initializeCatalog() {
  if (root.dataset.page === 'letter') {
    const letter = (new URLSearchParams(window.location.search).get('letra') || 'A').toLocaleUpperCase('pt-BR');
    document.querySelector('#letterTitle').textContent = `Filmes com ${letter}`;
    const titles = Object.values(MOVIE_CATALOG).filter((movie) => movie.title.toLocaleUpperCase('pt-BR').startsWith(letter)).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    document.querySelector('#letterList').innerHTML = titles.length ? titles.map((movie) => `<a href="${movie.href}">${escapeHtml(movie.title)} <span>${movie.year}</span></a>`).join('') : '<p>Nenhum filme cadastrado nesta letra.</p>';
    const search = document.querySelector('#letterSearch');
    search.addEventListener('input', () => {
      const term = normalizeText(search.value.trim());
      let visible = 0;
      document.querySelectorAll('#letterList a').forEach((link) => {
        link.hidden = !normalizeText(link.textContent).includes(term);
        if (!link.hidden) visible += 1;
      });
      document.querySelector('#letterEmpty').hidden = visible > 0 || !titles.length;
    });
  }
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
initializeCatalog();
initialize();
