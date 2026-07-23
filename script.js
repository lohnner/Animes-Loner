import { firebaseConfig, firebaseReady } from './firebase-config.js';

const TOTAL_EPISODES = 220;
const XP_PER_EPISODE = 22;
const DATA_VERSION = 1;
let services = null;
let currentUser = null;
let currentProfile = null;

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const levelFromXp = (xp) => Math.floor(Number(xp || 0) / 500) + 1;
const friendlyError = (error) => {
  const code = error?.code || '';
  if (code.includes('invalid-credential')) return 'E-mail ou senha incorretos.';
  if (code.includes('email-already-in-use')) return 'Este e-mail já possui uma conta.';
  if (code.includes('weak-password')) return 'Use uma senha com pelo menos 6 caracteres.';
  if (code.includes('popup-closed')) return 'A janela de login foi fechada.';
  return 'Não foi possível concluir. Tente novamente.';
};

async function initFirebase() {
  if (!firebaseReady) return;
  const [appModule, authModule, dbModule] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
  ]);
  const app = appModule.initializeApp(firebaseConfig);
  services = { auth: authModule.getAuth(app), db: dbModule.getFirestore(app), ...authModule, ...dbModule };
  services.onAuthStateChanged(services.auth, handleAuthState);
}

async function handleAuthState(user) {
  currentUser = user;
  if (!user) { currentProfile = null; renderAuth(); renderProgress(); renderProfile(); return; }
  const ref = services.doc(services.db, 'users', user.uid);
  const snapshot = await services.getDoc(ref);
  const old = snapshot.exists() ? snapshot.data() : {};
  const migrated = old.animeDataVersion !== DATA_VERSION;
  currentProfile = {
    ...old, uid: user.uid, email: user.email || old.email || '',
    nick: old.nick || user.displayName || (user.email || 'Ninja').split('@')[0],
    watchedEpisodes: migrated ? 0 : Math.min(TOTAL_EPISODES, Number(old.watchedEpisodes || 0)),
    xp: migrated ? 0 : Number(old.xp || 0), animeDataVersion: DATA_VERSION
  };
  currentProfile.xp = currentProfile.watchedEpisodes * XP_PER_EPISODE;
  currentProfile.level = levelFromXp(currentProfile.xp);
  await services.setDoc(ref, { ...currentProfile, updatedAt: services.serverTimestamp() }, { merge: true });
  renderAuth(); renderProgress(); renderProfile();
}

function renderAuth() {
  const area = $('#authArea'); if (!area) return;
  area.innerHTML = currentUser
    ? `<div class="user-menu"><a href="perfil.html">${escapeHtml(currentProfile?.nick || 'Perfil')}</a><button class="button ghost" id="logout">Sair</button></div>`
    : '<button class="button ghost" data-open-auth>Entrar</button>';
}

function openAuth() { const modal = $('#authModal'); if (modal) { modal.hidden = false; modal.querySelector('input')?.focus(); } }
function closeAuth() { const modal = $('#authModal'); if (modal) modal.hidden = true; }
function setStatus(selector, message, type = '') { const el = $(selector); if (el) { el.textContent = message; el.className = `status ${type}`; } }

async function saveProgress(target) {
  if (!currentUser || !services) { openAuth(); setStatus('#progressStatus','Entre na sua conta para salvar seu progresso.'); return; }
  const watched = Math.max(0, Math.min(TOTAL_EPISODES, Number.parseInt(target, 10) || 0));
  const xp = watched * XP_PER_EPISODE;
  const ref = services.doc(services.db, 'users', currentUser.uid);
  await services.setDoc(ref, { watchedEpisodes: watched, xp, level: levelFromXp(xp), animeDataVersion: DATA_VERSION, updatedAt: services.serverTimestamp() }, { merge: true });
  currentProfile = { ...currentProfile, watchedEpisodes: watched, xp, level: levelFromXp(xp) };
  renderProgress(); renderProfile();
  setStatus('#progressStatus', `Progresso salvo: ${watched} episódios e ${xp.toLocaleString('pt-BR')} XP.`, 'ok');
}

function renderProgress() {
  const watched = Number(currentProfile?.watchedEpisodes || 0);
  if ($('#watchedCount')) $('#watchedCount').textContent = watched;
  if ($('#xpTotal')) $('#xpTotal').textContent = `${(watched * XP_PER_EPISODE).toLocaleString('pt-BR')} XP`;
  if ($('#progressBar')) $('#progressBar').style.width = `${watched / TOTAL_EPISODES * 100}%`;
  document.querySelectorAll('.episode-item').forEach((item) => item.classList.toggle('watched', Number(item.dataset.episode) <= watched));
  if (currentUser) setStatus('#progressStatus', watched ? `Você chegou ao episódio ${watched}.` : 'Comece pelo episódio 1 e ganhe seus primeiros 22 XP.');
}

function buildEpisodes() {
  const grid = $('#episodeGrid'); if (!grid) return;
  grid.innerHTML = Array.from({length: TOTAL_EPISODES}, (_, index) => `<button class="episode-item" type="button" data-episode="${index + 1}">Episódio ${index + 1}</button>`).join('');
  renderProgress();
}

async function renderRanking() {
  const list = $('#rankingList'); if (!list || !services) return;
  try {
    const snapshot = await services.getDocs(services.collection(services.db, 'users'));
    const users = snapshot.docs.map(d => d.data()).filter(u => u.animeDataVersion === DATA_VERSION).sort((a,b) => Number(b.xp||0)-Number(a.xp||0)).slice(0,100);
    list.innerHTML = users.length ? users.map((u,i) => `<div class="rank-row"><span class="rank-position">#${i+1}</span><div><strong>${escapeHtml(u.nick || 'Ninja Loner')}</strong><small>${Number(u.watchedEpisodes||0)} episódios assistidos</small></div><b>${Number(u.xp||0).toLocaleString('pt-BR')} XP</b></div>`).join('') : '<p>Ainda não há ninjas no ranking de animes.</p>';
  } catch { list.innerHTML = '<p>Não foi possível carregar o ranking agora.</p>'; }
}

function renderProfile() {
  const content = $('#profileContent'); if (!content) return;
  if (!currentUser) { content.innerHTML = '<p>Entre na sua conta para ver seu perfil.</p><a class="button primary" href="index.html">Entrar</a>'; return; }
  const watched = Number(currentProfile?.watchedEpisodes || 0), xp = watched * XP_PER_EPISODE;
  content.innerHTML = `<h2>${escapeHtml(currentProfile.nick)}</h2><p>${escapeHtml(currentProfile.email)}</p><div class="profile-stats"><div><small>Episódios assistidos</small><strong>${watched}</strong></div><div><small>XP de animes</small><strong>${xp.toLocaleString('pt-BR')}</strong></div><div><small>Level</small><strong>${levelFromXp(xp)}</strong></div></div><p>Anime atual: <b>Naruto</b> • episódio ${watched} de ${TOTAL_EPISODES}</p>`;
}

document.addEventListener('click', async (event) => {
  if (event.target.closest('[data-open-auth]')) openAuth();
  if (event.target.closest('[data-close-auth]') || event.target.id === 'authModal') closeAuth();
  if (event.target.closest('#logout')) await services?.signOut(services.auth);
  if (event.target.closest('#addEpisode')) await saveProgress(Number(currentProfile?.watchedEpisodes || 0) + 1);
  const episode = event.target.closest('.episode-item'); if (episode) await saveProgress(episode.dataset.episode);
});

$('#episodeInput')?.addEventListener('keydown', async (event) => { if (event.key === 'Enter') { event.preventDefault(); await saveProgress(event.currentTarget.value); } });
$('#episodeSearch')?.addEventListener('input', (event) => { const query = event.currentTarget.value.trim(); document.querySelectorAll('.episode-item').forEach(item => item.hidden = query && !item.dataset.episode.includes(query)); });
$('#toggleAuth')?.addEventListener('click', () => { const login=$('#loginForm'), register=$('#registerForm'), registering=register.hidden; login.hidden=registering; register.hidden=!registering; $('#authTitle').textContent=registering?'Criar conta':'Bem-vindo'; $('#toggleAuth').textContent=registering?'Já tenho uma conta':'Ainda não tenho conta'; });
$('#loginForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const data=new FormData(event.currentTarget); try { setStatus('#authStatus','Entrando...'); await services.signInWithEmailAndPassword(services.auth,data.get('email'),data.get('password')); closeAuth(); } catch(error) { setStatus('#authStatus',friendlyError(error),'error'); } });
$('#registerForm')?.addEventListener('submit', async (event) => { event.preventDefault(); const data=new FormData(event.currentTarget); if(data.get('password')!==data.get('confirm')) return setStatus('#authStatus','As senhas não coincidem.','error'); try { setStatus('#authStatus','Criando conta...'); await services.createUserWithEmailAndPassword(services.auth,data.get('email'),data.get('password')); closeAuth(); } catch(error) { setStatus('#authStatus',friendlyError(error),'error'); } });
$('#googleLogin')?.addEventListener('click', async () => { try { await services.signInWithPopup(services.auth,new services.GoogleAuthProvider()); closeAuth(); } catch(error) { setStatus('#authStatus',friendlyError(error),'error'); } });

buildEpisodes(); renderAuth(); renderProfile(); initFirebase().then(renderRanking).catch(() => setStatus('#authStatus','Firebase indisponível no momento.','error'));
