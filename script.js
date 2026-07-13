const runtimeAssetVersion = Date.now().toString();

const { firebaseConfig, firebaseReady } = await import(`./firebase-config.js?v=${runtimeAssetVersion}`);
const { articles, catalogo, comics } = await import(`./catalogo.js?v=${runtimeAssetVersion}`);

const defaultAvatarPath = "Avatar/homemaranha.png";
const profileAvatarRewards = [
  {
    id: "naruto-1-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-1-2000",
    title: "Volume 1",
    description: "Leia o Volume 1",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto1.png",
    avatarName: "Naruto 1"
  },
  {
    id: "naruto-2-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-2-2000",
    title: "Volume 2",
    description: "Leia o Volume 2",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto2.png",
    avatarName: "Naruto 2"
  },
  {
    id: "naruto-3-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-3-2000",
    title: "Volume 3",
    description: "Leia o Volume 3",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto3.png",
    avatarName: "Naruto 3"
  },
  {
    id: "naruto-4-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-4-2000",
    title: "Volume 4",
    description: "Leia o Volume 4",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto4.png",
    avatarName: "Naruto 4"
  },
  {
    id: "naruto-5-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-5-2000",
    title: "Volume 5",
    description: "Leia o Volume 5",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto5.png",
    avatarName: "Naruto 5"
  },
  {
    id: "naruto-6-volume",
    tabId: "naruto",
    tabTitle: "Naruto",
    universe: "Naruto",
    comicId: "naruto-6-2001",
    title: "Volume 6",
    description: "Leia o Volume 6",
    requiredReads: 1,
    avatarPath: "Avatar/Naruto/naruto6.png",
    avatarName: "Naruto 6"
  }
];
const profileCacheKey = "loner-manga:lastProfile";
const siteUpdateCheckInterval = 90 * 1000;
const pageTransitionDelay = 90;
const searchDebounceDelay = 150;

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

let modalReturnFocusEl = null;

function trapModalFocus(overlay) {
  const returnFocusEl = document.activeElement;
  modalReturnFocusEl = returnFocusEl instanceof HTMLElement ? returnFocusEl : null;

  const focusable = overlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusable.length) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first.focus();

  overlay.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function closeModal(overlay) {
  overlay?.remove();

  if (modalReturnFocusEl) {
    modalReturnFocusEl.focus();
    modalReturnFocusEl = null;
  }
}

renderSharedSidebar();

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const accountPanel = document.querySelector("#accountPanel");
const authBadge = document.querySelector("#authBadge");
const authMessage = document.querySelector("#authMessage");
const showRegister = document.querySelector("#showRegister");
const showLogin = document.querySelector("#showLogin");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#siteSearch");
const searchResults = document.querySelector("#searchResults");
const universeSearchInput = document.querySelector("#universeSearch");
const universeSearchStatus = document.querySelector("#universeSearchStatus");
const characterSearchInput = document.querySelector("#characterSearch");
const characterSearchStatus = document.querySelector("#characterSearchStatus");
const characterList = document.querySelector("#characterList");
const articleContent = document.querySelector("#articleContent");
const homeRecentHqs = document.querySelector("#homeRecentHqs");
const homeRecentSeries = [
  {
    seriesId: "yu-gi-oh-1996",
    coverComicId: "yu-gi-oh-1-1997"
  },
  {
    seriesId: "fairy-tail-2006",
    coverComicId: "fairy-tail-1-2006"
  },
  {
    seriesId: "naruto-1999",
    coverComicId: "naruto-1-2000"
  }
];
const smartSearchForm = document.querySelector("#smartSearchForm");
const smartSearchInput = document.querySelector("#smartSearchInput");
const smartSearchResults = document.querySelector("#smartSearchResults");
const smartSearchStatus = document.querySelector("#smartSearchStatus");
const navLinks = document.querySelectorAll("[data-section]");
const profilePage = document.querySelector("#profilePage");
const rankingPage = document.querySelector("#rankingPage");

let firebaseServices = null;
let currentUser = null;
let currentProfile = null;
let currentInteraction = {};
let interactionUnsubscribe = null;
let readersUnsubscribe = null;
let volumeActions = null;
let readersButton = null;
let pendingAuthError = "";
let currentSiteFingerprint = "";
let siteUpdateCheckInFlight = false;
let pageLeaveTimer = 0;

renderCachedProfile();
resetPageTransition();
window.addEventListener("pageshow", resetPageTransition);
startSiteUpdateWatcher();

function rootPath() {
  const path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");

  if (path.includes("/Mangás/")) {
    return "../../";
  }

  if (path.includes("/Universos/")) {
    return "../";
  }

  if (path.includes("/Personagens/")) {
    return "../";
  }

  return "";
}

function sidebarSection() {
  const hashSection = window.location.hash.replace("#", "");
  const hashSections = ["personagens", "ranking"];

  if (hashSections.includes(hashSection)) {
    return hashSection;
  }

  const path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");

  if (path.includes("/Universos/") || path.includes("/Mangás/")) {
    return "universos";
  }

  if (path.includes("/Personagens/")) {
    return "personagens";
  }

  if (path.endsWith("/perfil.html")) {
    return "";
  }

  if (path.endsWith("/ranking.html")) {
    return "ranking";
  }

  if (path.endsWith("/pesquisar.html")) {
    return "pesquisar";
  }

  return "inicio";
}

function acervoTotal(tipo) {
  return catalogo[tipo]?.length || 0;
}

function renderSharedSidebar() {
  const sidebar = document.querySelector(".sidebar");

  if (!sidebar) {
    return;
  }

  const root = rootPath();
  const activeSection = sidebarSection();
  const navItems = [
    { label: "HOME", section: "inicio", href: `${root}index.html` },
    { label: "Mangás", section: "universos", href: `${root}Universos/universos.html` },
    { label: "Pesquisar", section: "pesquisar", href: `${root}pesquisar.html` },
    { label: "Ranking de Usuários", section: "ranking", href: `${root}ranking.html` }
  ];
  const navLinksMarkup = navItems
    .map((item) => {
      const isActive = item.section === activeSection;
      return `
          <a href="${item.href}" class="nav-link${isActive ? " active" : ""}" data-section="${item.section}"${isActive ? ' aria-current="page"' : ""}>${item.label}</a>`;
    })
    .join("");

  sidebar.innerHTML = `
        <a class="brand" href="${root}index.html" aria-label="Loner Mangá página inicial">
          <span class="brand-mark">LM</span>
          <span>
            <strong>Loner Mangá</strong>
            <small>Arquivo de mangás</small>
          </span>
        </a>

        <section class="auth-panel" aria-labelledby="authTitle">
          <div class="auth-heading">
            <h2 id="authTitle">Conta</h2>
            <span id="authBadge">...</span>
          </div>

          <form class="auth-form" id="loginForm" hidden>
            <label for="loginUser">E-mail</label>
            <input id="loginUser" name="usuario" type="email" autocomplete="email" required />

            <label for="loginPassword">Senha</label>
            <input id="loginPassword" name="senha" type="password" autocomplete="current-password" required />

            <button class="button primary" type="submit">Entrar</button>
            <button class="button ghost" type="button" id="showRegister">Cadastro</button>
          </form>

          <form class="auth-form" id="registerForm" hidden>
            <label for="registerUser">Novo e-mail</label>
            <input id="registerUser" name="novoUsuario" type="email" autocomplete="email" required />

            <label for="registerPassword">Criar senha</label>
            <input id="registerPassword" name="novaSenha" type="password" autocomplete="new-password" minlength="6" required />

            <label for="registerConfirm">Confirmar senha</label>
            <input id="registerConfirm" name="confirmarSenha" type="password" autocomplete="new-password" minlength="6" required />

            <button class="button primary" type="submit">Criar conta</button>
            <button class="button ghost" type="button" id="showLogin">Voltar</button>
          </form>

          <div class="account-panel" id="accountPanel" hidden></div>

          <p class="auth-message" id="authMessage" aria-live="polite"></p>
        </section>

        <nav class="wiki-nav" aria-label="Navegação principal">${navLinksMarkup}
        </nav>

        <section class="side-list" aria-labelledby="sideStats">
          <h2 id="sideStats">Acervo</h2>
          <dl>
            <div>
              <dt>Mangás</dt>
              <dd>${acervoTotal("universos")}</dd>
            </div>
            <div>
              <dt>Volumes</dt>
              <dd>${acervoTotal("hqs")}</dd>
            </div>
          </dl>
        </section>
  `;
}

function assetPath(path) {
  if (!path) {
    return "";
  }

  if (/^(https?:|data:|\/)/.test(path)) {
    return path;
  }

  return `${rootPath()}${path}`;
}

function imageAssetPath(path) {
  const resolvedPath = assetPath(path);

  if (/^(data:|https?:)/.test(resolvedPath)) {
    return resolvedPath;
  }

  return resolvedPath.replaceAll("#", "%23");
}

function shouldWatchSiteUpdates() {
  return window.location.protocol === "http:" || window.location.protocol === "https:";
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function resetPageTransition() {
  document.documentElement.classList.remove("loner-page-leaving");

  if (pageLeaveTimer) {
    window.clearTimeout(pageLeaveTimer);
    pageLeaveTimer = 0;
  }
}

function leavePage(url, options = {}) {
  if (!url) {
    return;
  }

  resetPageTransition();

  if (prefersReducedMotion()) {
    if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
    return;
  }

  document.documentElement.classList.add("loner-page-leaving");

  pageLeaveTimer = window.setTimeout(() => {
    pageLeaveTimer = 0;

    if (options.replace) {
      window.location.replace(url);
    } else {
      window.location.href = url;
    }
  }, pageTransitionDelay);
}

function shouldSmoothNavigate(link, event) {
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  if (link.target || link.hasAttribute("download")) {
    return false;
  }

  const rawHref = link.getAttribute("href") || "";

  if (!rawHref || rawHref.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(rawHref)) {
    return false;
  }

  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
    return false;
  }

  return true;
}

function cacheBustedUrl(resource) {
  const url = new URL(resource, window.location.href);
  url.searchParams.set("lhqProbe", Date.now().toString());
  return url.toString();
}

async function fetchVersionSource(resource) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(cacheBustedUrl(resource), {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      return "";
    }

    return response.text();
  } catch (error) {
    return "";
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function hashText(text) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

async function readSiteFingerprint() {
  const pageUrl = new URL(window.location.href);
  pageUrl.searchParams.delete("lhqProbe");

  const sources = await Promise.all([
    fetchVersionSource(pageUrl.toString()),
    fetchVersionSource(assetPath("catalogo.js")),
    fetchVersionSource(assetPath("script.js")),
    fetchVersionSource(assetPath("styles.css"))
  ]);

  if (sources.some((source) => !source)) {
    return "";
  }

  return hashText(sources.join("\n/* loner-manga-version-source */\n"));
}

function reloadWithDeployVersion(version) {
  const shortVersion = version.slice(0, 8);
  const url = new URL(window.location.href);

  if (url.searchParams.get("lhq") === shortVersion) {
    return;
  }

  url.searchParams.set("lhq", shortVersion);
  leavePage(url.toString(), { replace: true });
}

async function checkForSiteUpdate() {
  if (!shouldWatchSiteUpdates() || siteUpdateCheckInFlight) {
    return;
  }

  siteUpdateCheckInFlight = true;

  try {
    const latestFingerprint = await readSiteFingerprint();

    if (!latestFingerprint) {
      return;
    }

    if (!currentSiteFingerprint) {
      currentSiteFingerprint = latestFingerprint;
      return;
    }

    if (currentSiteFingerprint !== latestFingerprint) {
      currentSiteFingerprint = latestFingerprint;
      reloadWithDeployVersion(latestFingerprint);
    }
  } finally {
    siteUpdateCheckInFlight = false;
  }
}

function startSiteUpdateWatcher() {
  if (!shouldWatchSiteUpdates()) {
    return;
  }

  window.setTimeout(checkForSiteUpdate, 3000);
  window.setInterval(checkForSiteUpdate, siteUpdateCheckInterval);
  window.addEventListener("focus", checkForSiteUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkForSiteUpdate();
    }
  });
}

function renderHomeRecentHqs() {
  if (!homeRecentHqs) {
    return;
  }

  const recentSeries = homeRecentSeries
    .map((item) => {
      const series = catalogo.series.find((entry) => entry.id === item.seriesId);
      const coverComic = comics[item.coverComicId];

      if (!series || !coverComic) {
        return null;
      }

      return {
        ...series,
        cover: coverComic.cover,
        coverTitle: coverComic.shortTitle || coverComic.title
      };
    })
    .filter(Boolean);

  homeRecentHqs.innerHTML = recentSeries
    .map(
      (series) => `
        <a class="recent-hq-card" href="${assetPath(series.href)}">
          <span class="recent-hq-cover">
            <img src="${imageAssetPath(series.cover)}" alt="Capa de ${escapeHtml(series.coverTitle)}" />
          </span>
          <span class="recent-hq-body">
            <strong>${escapeHtml(series.title)}</strong>
            <span class="recent-hq-meta">
              <span>${escapeHtml(series.year || "Ano")}</span>
            </span>
          </span>
        </a>
      `
    )
    .join("");
}

function sortedCharacters() {
  const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
  return [...catalogo.personagens].sort((first, second) => collator.compare(first.title, second.title));
}

function updateCharacterSearchStatus(count) {
  if (!characterSearchStatus) {
    return;
  }

  characterSearchStatus.textContent = count === 1 ? "1 personagem" : `${count} personagens`;
}

function renderCharacterIndex() {
  if (!characterList) {
    return;
  }

  const characters = sortedCharacters();

  characterList.innerHTML = characters
    .map(
      (character) => `
        <a class="character-card" href="${assetPath(character.href)}" aria-label="${escapeHtml(character.title)}">
          <strong>${escapeHtml(character.title)}</strong>
          <small>${escapeHtml(character.universe || "Universo não informado")}</small>
        </a>
      `
    )
    .join("");

  updateCharacterSearchStatus(characters.length);
}

function loginOriginWarning() {
  if (window.location.protocol === "file:") {
    return "Para login, abra pelo arquivo abrir-loner-manga-local.cmd ou use http://localhost:8766/index.html.";
  }

  if (window.location.hostname === "127.0.0.1") {
    return "Para login Google, use localhost no lugar de 127.0.0.1.";
  }

  return "";
}

function shouldUseGoogleRedirect() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const narrowScreen = window.matchMedia?.("(max-width: 820px)")?.matches;
  const mobileAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return Boolean(coarsePointer || narrowScreen || mobileAgent);
}

function createGoogleProvider() {
  const provider = new firebaseServices.GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");
  provider.setCustomParameters?.({ prompt: "select_account" });
  return provider;
}

function shouldFallbackToRedirect(error) {
  const code = error?.code || "";
  const popupBlocked =
    code.includes("auth/popup-blocked") || code.includes("auth/operation-not-supported-in-this-environment");
  const popupInterrupted = code.includes("auth/cancelled-popup-request") || code.includes("auth/popup-closed-by-user");

  return popupBlocked || (shouldUseGoogleRedirect() && popupInterrupted);
}

function pagePath(path, params = {}) {
  const url = new URL(`${rootPath()}${path}`, window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url.href;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function timestampToMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value === "number") {
    return value;
  }

  return Date.parse(value) || 0;
}

function formatShortDate(value) {
  const millis = timestampToMillis(value);

  if (!millis) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(millis));
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function comicYear(hq) {
  if (hq?.year) {
    return hq.year;
  }

  const source = [hq?.title, hq?.fileName, hq?.href].filter(Boolean).join(" ");
  const match = source.match(/\b(?:19|20)\d{2}\b/);

  return match ? match[0] : "Ano";
}

function comicSearchKey(value) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(1964|1977|1985|2024|2025)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pathFileName(path = "") {
  const cleanPath = String(path).split("?")[0];
  let decodedPath = cleanPath;

  try {
    decodedPath = decodeURIComponent(cleanPath);
  } catch (error) {
    console.warn("Não foi possível decodificar o caminho:", cleanPath, error);
  }

  return decodedPath.split("/").pop() || "";
}

function legacyJakkuInsurgencyFallback(item = {}) {
  const searchable = comicSearchKey(`${item.href || ""} ${item.cover || ""} ${item.title || ""} ${item.shortTitle || ""}`);

  if (!searchable.includes("crescente") || !searchable.includes("batalha de jakku")) {
    return null;
  }

  const issue = searchable.match(/\b([1-4])\b/)?.[1];

  if (!issue) {
    return null;
  }

  return Object.values(comics).find((comic) => comic.id === `star-wars-a-batalha-de-jakku-insurgencia-em-ascensao-${issue}-2024`) || null;
}

function catalogComicFallback(item = {}) {
  const allComics = Object.values(comics);
  const fileName = pathFileName(item.href);
  const candidateKeys = [item.shortTitle, item.title]
    .map(comicSearchKey)
    .filter(Boolean);

  return (
    comics[item.comicId] ||
    comics[item.id] ||
    legacyJakkuInsurgencyFallback(item) ||
    allComics.find((comic) => comic.href === item.href) ||
    allComics.find((comic) => comic.fileName && comic.fileName === fileName) ||
    allComics.find((comic) => {
      const comicKeys = [comic.shortTitle, comic.title].map(comicSearchKey).filter(Boolean);
      return candidateKeys.some((candidateKey) =>
        comicKeys.some((comicKey) => comicKey === candidateKey || comicKey.includes(candidateKey) || candidateKey.includes(comicKey))
      );
    }) ||
    {}
  );
}

function enrichedComicInteraction(item = {}) {
  const fallback = catalogComicFallback(item);

  return {
    ...item,
    ...fallback,
    title: item.title || fallback.title || item.shortTitle || "Mangá",
    shortTitle: item.shortTitle || fallback.shortTitle || item.title || "Mangá",
    href: fallback.href || item.href || "#",
    cover: fallback.cover || item.cover || "",
    universe: fallback.universe || item.universe || "",
    series: fallback.series || item.series || "",
    pageCount: Number(fallback.pageCount || item.pageCount || 0),
    xpReward: Number(fallback.xpReward || item.xpReward || fallback.pageCount || 0)
  };
}

function currentComic() {
  const path = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");
  return Object.values(comics).find((comic) => path.endsWith(`/${comic.fileName}`)) || null;
}

function currentSeriesFavorite() {
  const fileName = pathFileName(window.location.pathname);
  const series = catalogo.series.find((item) => pathFileName(item.href) === fileName);

  if (!series) return null;

  const firstVolume = Object.values(comics).find((comic) => comic.series === series.title);
  if (!firstVolume) return null;

  return {
    ...firstVolume,
    id: `favorite-${series.id}`,
    title: series.title,
    shortTitle: series.title,
    href: series.href,
    cover: firstVolume.cover,
    pageCount: 0,
    xpReward: 0,
    seriesFavorite: true
  };
}

function xpNeededForLevel(level) {
  return Math.pow(level - 1, 2) * 100;
}

function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpNeededForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

function xpProgress(profile = {}) {
  const xp = Number(profile.xp || 0);
  const level = Number(profile.level || levelFromXp(xp));
  const currentFloor = xpNeededForLevel(level);
  const nextFloor = xpNeededForLevel(level + 1);
  const current = Math.max(0, xp - currentFloor);
  const next = Math.max(1, nextFloor - currentFloor);

  return {
    level,
    xp,
    current,
    next,
    percent: Math.min(100, Math.max(0, (current / next) * 100))
  };
}

function normalizeCatalogKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function readCountByUniverse(interactions, universe) {
  const universeKey = normalizeCatalogKey(universe);

  return interactions.filter((item) => item.read && normalizeCatalogKey(item.universe) === universeKey).length;
}

function hasReadComic(interactions, comicId) {
  return interactions.some((item) => item.read && (item.comicId === comicId || item.id === comicId));
}

function profileAchievementState(interactions, reward) {
  let current = readCountByUniverse(interactions, reward.universe);

  if (reward.comicId) {
    current = hasReadComic(interactions, reward.comicId) ? 1 : 0;
  }

  const required = Number(reward.requiredReads || 1);
  const unlocked = current >= required;

  return {
    current,
    required,
    unlocked,
    percent: Math.min(100, Math.max(0, (current / required) * 100))
  };
}

function unlockedProfileAvatarPaths(interactions) {
  return profileAvatarRewards
    .filter((reward) => profileAchievementState(interactions, reward).unlocked)
    .map((reward) => reward.avatarPath);
}

function setMessage(text, type = "") {
  if (!authMessage) {
    return;
  }

  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`.trim();
}

function setActiveSection(section) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === section);
  });
}

function normalizeAuthForms() {
  const loginLabel = document.querySelector('label[for="loginUser"]');
  const registerLabel = document.querySelector('label[for="registerUser"]');
  const loginUser = document.querySelector("#loginUser");
  const registerUser = document.querySelector("#registerUser");

  if (loginLabel) {
    loginLabel.textContent = "E-mail";
  }

  if (registerLabel) {
    registerLabel.textContent = "Novo e-mail";
  }

  if (loginUser) {
    loginUser.type = "email";
    loginUser.autocomplete = "email";
  }

  if (registerUser) {
    registerUser.type = "email";
    registerUser.autocomplete = "email";
  }

  if (loginForm && !document.querySelector("#googleLoginButton")) {
    const googleButton = document.createElement("button");
    googleButton.className = "button google";
    googleButton.type = "button";
    googleButton.id = "googleLoginButton";
    googleButton.textContent = "Entrar com Google";
    showRegister?.insertAdjacentElement("beforebegin", googleButton);
  }
}

function setFirebaseUnavailable() {
  loginForm?.querySelectorAll("input, button").forEach((item) => {
    item.disabled = true;
  });
  registerForm?.querySelectorAll("input, button").forEach((item) => {
    item.disabled = true;
  });

  if (authBadge) {
    authBadge.textContent = "Configurar";
    authBadge.style.color = "var(--danger)";
  }

  setMessage("Cole a configuração do Web App em firebase-config.js para ativar login e perfis.", "error");
  updateVolumeActionsUi();
  renderProfilePageUnavailable();
  renderRankingPageUnavailable();
}

async function loadFirebase() {
  if (!firebaseReady) {
    setFirebaseUnavailable();
    return null;
  }

  if (firebaseServices) {
    return firebaseServices;
  }

  const [appModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
  ]);

  const app = appModule.initializeApp(firebaseConfig);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);

  await authModule.setPersistence(auth, authModule.browserLocalPersistence).catch(() => {});

  firebaseServices = {
    auth,
    db,
    GoogleAuthProvider: authModule.GoogleAuthProvider,
    getRedirectResult: authModule.getRedirectResult,
    signInWithPopup: authModule.signInWithPopup,
    createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
    signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
    signInWithRedirect: authModule.signInWithRedirect,
    browserPopupRedirectResolver: authModule.browserPopupRedirectResolver,
    signOut: authModule.signOut,
    onAuthStateChanged: authModule.onAuthStateChanged,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    getDoc: firestoreModule.getDoc,
    getDocs: firestoreModule.getDocs,
    onSnapshot: firestoreModule.onSnapshot,
    serverTimestamp: firestoreModule.serverTimestamp,
    setDoc: firestoreModule.setDoc
  };

  return firebaseServices;
}

function userRef(uid) {
  return firebaseServices.doc(firebaseServices.db, "users", uid);
}

function userComicRef(uid, comicId) {
  return firebaseServices.doc(firebaseServices.db, "users", uid, "comics", comicId);
}

function comicInteractionRef(comicId, uid) {
  return firebaseServices.doc(firebaseServices.db, "comics", comicId, "interactions", uid);
}

async function ensureProfile(user) {
  const ref = userRef(user.uid);
  const snapshot = await firebaseServices.getDoc(ref);

  if (snapshot.exists()) {
    const profile = snapshot.data();
    const normalizedLevel = levelFromXp(Number(profile.xp || 0));

    if (profile.level !== normalizedLevel) {
      await firebaseServices.setDoc(ref, { level: normalizedLevel }, { merge: true });
      return { ...profile, level: normalizedLevel };
    }

    return profile;
  }

  const profile = {
    uid: user.uid,
    nick: "",
    nickLower: "",
    avatarPath: defaultAvatarPath,
    xp: 0,
    level: 1,
    createdAt: firebaseServices.serverTimestamp(),
    updatedAt: firebaseServices.serverTimestamp()
  };

  await firebaseServices.setDoc(ref, profile, { merge: true });
  return { ...profile, createdAt: null, updatedAt: null };
}

function openNickDialog(user, profile) {
  return new Promise((resolve) => {
    const existing = document.querySelector("#nickDialog");
    existing?.remove();

    const suggestedNick = profile.nick || user.displayName || "";
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.id = "nickDialog";
    overlay.innerHTML = `
      <section class="modal-dialog nick-dialog" role="dialog" aria-modal="true" aria-labelledby="nickTitle">
        <h2 id="nickTitle">Escolha seu Nick</h2>
        <p>Esse nome vai aparecer para os outros usuários da Loner Mangá.</p>
        <form id="nickForm" class="auth-form">
          <label for="nickInput">Nick público</label>
          <input id="nickInput" name="nick" minlength="3" maxlength="24" required value="${escapeHtml(suggestedNick)}" />
          <button class="button primary" type="submit">Salvar Nick</button>
          <p class="auth-message" id="nickMessage" aria-live="polite"></p>
        </form>
      </section>
    `;
    document.body.append(overlay);
    trapModalFocus(overlay);

    const input = overlay.querySelector("#nickInput");
    const message = overlay.querySelector("#nickMessage");
    input?.focus();
    input?.select();

    overlay.querySelector("#nickForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nick = String(new FormData(event.currentTarget).get("nick")).trim();

      if (nick.length < 3) {
        message.textContent = "Use pelo menos 3 caracteres.";
        message.className = "auth-message error";
        return;
      }

      const updatedProfile = {
        uid: user.uid,
        nick,
        nickLower: nick.toLowerCase(),
        avatarPath: profile.avatarPath || defaultAvatarPath,
        xp: Number(profile.xp || 0),
        level: levelFromXp(Number(profile.xp || 0)),
        updatedAt: firebaseServices.serverTimestamp()
      };

      await firebaseServices.setDoc(userRef(user.uid), updatedProfile, { merge: true });
      closeModal(overlay);
      resolve({ ...profile, ...updatedProfile });
    });
  });
}

async function ensureNick(user, profile) {
  if (profile.nick) {
    return profile;
  }

  return openNickDialog(user, profile);
}

function temporaryProfileFromAuth(user) {
  const fallbackNick = user.displayName || user.email?.split("@")[0] || "Usuário";

  return {
    uid: user.uid,
    nick: fallbackNick,
    avatarPath: defaultAvatarPath,
    xp: 0,
    level: 1,
    firestoreBlocked: true
  };
}

function cachedProfilePayload(profile) {
  if (!profile?.nick) {
    return null;
  }

  return {
    uid: profile.uid || "",
    nick: profile.nick,
    avatarPath: profile.avatarPath || defaultAvatarPath,
    xp: Number(profile.xp || 0),
    level: levelFromXp(Number(profile.xp || 0))
  };
}

function readCachedProfile() {
  try {
    const profile = cachedProfilePayload(JSON.parse(localStorage.getItem(profileCacheKey) || "null"));
    return profile?.nick ? profile : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile) {
  const payload = cachedProfilePayload(profile);

  if (!payload || profile.firestoreBlocked) {
    return;
  }

  try {
    localStorage.setItem(profileCacheKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Não foi possível salvar o perfil em cache local:", error);
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(profileCacheKey);
  } catch (error) {
    console.warn("Não foi possível limpar o perfil em cache local:", error);
  }
}

function renderCachedProfile() {
  const cachedProfile = readCachedProfile();

  if (!cachedProfile) {
    return;
  }

  currentProfile = cachedProfile;
  renderSignedIn(cachedProfile, { skipCache: true });
}

function renderSignedOut() {
  if (!loginForm || !registerForm || !accountPanel || !authBadge) {
    return;
  }

  loginForm.hidden = false;
  registerForm.hidden = true;
  accountPanel.hidden = true;
  accountPanel.innerHTML = "";
  authBadge.textContent = "Visitante";
  authBadge.style.color = "var(--muted)";

  const originWarning = loginOriginWarning();

  if (pendingAuthError) {
    setMessage(pendingAuthError, "error");
  } else {
    setMessage(originWarning || "Entre com e-mail ou Google para salvar perfil e leituras.", originWarning ? "error" : "");
  }
}

function renderSignedIn(profile, options = {}) {
  if (!loginForm || !registerForm || !accountPanel || !authBadge) {
    return;
  }

  const progress = xpProgress(profile);
  const nick = profile.nick || "Sem nick";

  loginForm.hidden = true;
  registerForm.hidden = true;
  accountPanel.hidden = false;
  authBadge.textContent = "Online";
  authBadge.style.color = "var(--success)";
  accountPanel.innerHTML = `
    <div class="profile-summary">
      <img class="profile-avatar" src="${imageAssetPath(profile.avatarPath || defaultAvatarPath)}" alt="Avatar de ${escapeHtml(nick)}" />
      <div class="profile-summary-body">
        <strong>${escapeHtml(nick)}</strong>
        <span>Level ${progress.level}</span>
        <div class="xp-meter" aria-label="Barra de XP">
          <span style="width: ${progress.percent}%"></span>
        </div>
        <small>${progress.current} / ${progress.next} XP</small>
      </div>
    </div>
    <div class="profile-actions">
      <button class="button ghost" type="button" id="openMyProfile">Meu Perfil</button>
      <button class="button ghost" type="button" id="logoutButton">Sair</button>
    </div>
  `;
  setMessage("Perfil conectado na Loner Mangá.", "success");

  if (!options.skipCache) {
    writeCachedProfile(profile);
  }
}

function renderArticle(articleId) {
  if (!articleContent) {
    return;
  }

  const article = articles.find((item) => item.id === articleId);

  if (!article) {
    return;
  }

  articleContent.innerHTML = `
    <h3>${escapeHtml(article.title)}</h3>
    <p>${escapeHtml(article.summary)}</p>
    <div class="meta-list" aria-label="Metadados do verbete">
      <span>${escapeHtml(article.category)}</span>
      <span>${escapeHtml(article.year)}</span>
      ${article.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderSearchResults(query) {
  if (!searchResults) {
    return;
  }

  const normalized = normalizeSearchText(query);

  if (!normalized) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    return;
  }

  const matches = articles.filter((article) => {
    const searchableText = [article.title, article.category, article.year, article.summary, ...article.tags].join(" ");
    const searchable = normalizeSearchText(searchableText);
    return searchable.includes(normalized);
  });

  if (!matches.length) {
    searchResults.hidden = false;
    searchResults.innerHTML =
      '<div class="search-result" role="status"><strong>Nenhum verbete encontrado</strong><span>Tente outro termo.</span></div>';
    return;
  }

  searchResults.hidden = false;
  searchResults.innerHTML = matches
    .map(
      (article) => `
        <button class="search-result" type="button" data-open-article="${article.id}">
          <strong>${escapeHtml(article.title)}</strong>
          <span>${escapeHtml(article.category)} - ${article.tags.map(escapeHtml).join(", ")}</span>
        </button>
      `
    )
    .join("");
}

const smartSearchStopWords = new Set(["a", "o", "os", "as", "de", "do", "da", "dos", "das", "e", "em", "no", "na"]);
const smartSearchSynonyms = {
  naruto: ["uzumaki", "ninja", "konoha"],
  uzumaki: ["naruto"],
  konoha: ["vila", "folha"],
  kyuubi: ["raposa", "nove", "caudas", "kurama"],
  raposa: ["kyuubi", "nove", "caudas"],
  manga: ["hq", "quadrinho", "volume", "edicao"],
  mangas: ["hq", "quadrinho", "volume", "edicao"],
  quadrinho: ["manga", "hq", "volume", "edicao"],
  quadrinhos: ["manga", "hq", "volume", "edicao"],
  volume: ["manga", "hq", "edicao"],
  volumes: ["manga", "hq", "edicao"],
  edicao: ["manga", "hq", "volume"],
  edicoes: ["manga", "hq", "volume"],
  hq: ["manga", "volume", "edicao"],
  shonen: ["jump", "shueisha"],
  kishimoto: ["masashi"]
};

function smartSearchNormalize(value) {
  return normalizeSearchText(value)
    .replace(/['’]/g, "")
    .replace(/#/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function smartSearchBaseTokens(value) {
  const normalized = smartSearchNormalize(value);

  if (!normalized) {
    return [];
  }

  return normalized.split(" ").filter((token) => token && !smartSearchStopWords.has(token));
}

function smartSearchTokens(value, expand = true) {
  const tokens = new Set(smartSearchBaseTokens(value));

  if (!expand) {
    return [...tokens];
  }

  [...tokens].forEach((token) => {
    smartSearchSynonyms[token]?.forEach((synonym) => tokens.add(synonym));

    if (token.endsWith("s") && token.length > 3) {
      tokens.add(token.slice(0, -1));
    }
  });

  return [...tokens];
}

function smartSearchKindLabel(tipo) {
  const labels = {
    artigo: "Verbete",
    hq: "Mangá",
    personagem: "Personagem",
    serie: "Série",
    universo: "Universo"
  };

  return labels[tipo] || "Item";
}

function smartSearchEntry(item, tipo) {
  const isHq = tipo === "hq";
  const title = item.shortTitle || item.title;
  const year = isHq ? comicYear(item) : item.year;
  const meta = [
    smartSearchKindLabel(tipo),
    item.universe,
    item.series,
    item.character,
    year,
    isHq && item.pageCount ? `${formatNumber(item.pageCount)} páginas` : ""
  ].filter(Boolean);
  const searchText = [
    tipo,
    smartSearchKindLabel(tipo),
    item.id,
    item.title,
    item.shortTitle,
    item.universe,
    item.series,
    item.character,
    item.year,
    item.summary,
    item.category,
    ...(item.tags || []),
    ...(item.keywords || []),
    item.fileName,
    isHq ? "hq quadrinho edição comic" : ""
  ].join(" ");

  return {
    id: `${tipo}-${item.id}`,
    tipo,
    title,
    subtitle: meta.join(" / "),
    summary: item.summary || "",
    href: item.href || "index.html",
    cover: item.cover || "",
    primaryTitle: smartSearchNormalize(title),
    searchTitle: smartSearchNormalize(`${title} ${item.title || ""}`),
    searchText: smartSearchNormalize(searchText),
    searchTokens: smartSearchTokens(searchText),
    year,
    pageCount: item.pageCount || 0
  };
}

function smartSearchEntries() {
  return [
    ...catalogo.hqs.map((item) => smartSearchEntry(item, "hq")),
    ...catalogo.series.map((item) => smartSearchEntry(item, "serie")),
    ...catalogo.universos.map((item) => smartSearchEntry(item, "universo")),
    ...catalogo.personagens.map((item) => smartSearchEntry(item, "personagem")),
    ...articles.map((item) => smartSearchEntry(item, "artigo"))
  ];
}

function boundedDistance(first, second, limit = 2) {
  if (Math.abs(first.length - second.length) > limit) {
    return limit + 1;
  }

  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let row = 1; row <= first.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    let rowMin = previous[0];

    for (let column = 1; column <= second.length; column += 1) {
      const above = previous[column] + 1;
      const left = previous[column - 1] + 1;
      const replace = diagonal + (first[row - 1] === second[column - 1] ? 0 : 1);
      diagonal = previous[column];
      previous[column] = Math.min(above, left, replace);
      rowMin = Math.min(rowMin, previous[column]);
    }

    if (rowMin > limit) {
      return limit + 1;
    }
  }

  return previous[second.length];
}

function smartSearchTokenScore(queryToken, entryTokens) {
  let bestScore = 0;

  entryTokens.forEach((entryToken) => {
    if (entryToken === queryToken) {
      bestScore = Math.max(bestScore, 24);
      return;
    }

    if (entryToken.startsWith(queryToken) || queryToken.startsWith(entryToken)) {
      bestScore = Math.max(bestScore, queryToken.length >= 2 ? 16 : 0);
      return;
    }

    if (entryToken.includes(queryToken) || queryToken.includes(entryToken)) {
      bestScore = Math.max(bestScore, queryToken.length >= 3 ? 10 : 0);
      return;
    }

    if (queryToken.length >= 4 && entryToken.length >= 4 && boundedDistance(queryToken, entryToken, 1) <= 1) {
      bestScore = Math.max(bestScore, 8);
    }
  });

  return bestScore;
}

function smartSearchScore(entry, query, queryTokens) {
  let score = 0;
  let matchedTokens = 0;

  if (entry.primaryTitle === query) {
    score += 170;
  } else if (entry.searchTitle === query) {
    score += 140;
  } else if (entry.primaryTitle.startsWith(query)) {
    score += 110;
  } else if (entry.searchTitle.includes(query)) {
    score += 90;
  }

  if (entry.searchText.includes(query)) {
    score += 46;
  }

  queryTokens.forEach((token) => {
    const tokenScore = smartSearchTokenScore(token, entry.searchTokens);

    if (tokenScore) {
      matchedTokens += 1;
      score += tokenScore;
    }
  });

  if (entry.tipo === "hq") {
    score += 4;
  }

  return { ...entry, score, matchedTokens };
}

function smartResultPlaceholder(entry) {
  const initials = smartSearchKindLabel(entry.tipo)
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  return `<span class="smart-result-icon">${escapeHtml(initials)}</span>`;
}

function renderSmartResultCards(entries) {
  if (!entries.length) {
    smartSearchResults.innerHTML = `
      <div class="smart-empty-result">
        <strong>Nenhum resultado encontrado</strong>
        <span>Tente buscar por outro nome, número, universo, personagem ou série.</span>
      </div>
    `;
    return;
  }

  smartSearchResults.innerHTML = entries
    .map((entry) => {
      const media = entry.cover
        ? `<img src="${imageAssetPath(entry.cover)}" alt="Capa de ${escapeHtml(entry.title)}" />`
        : smartResultPlaceholder(entry);

      return `
        <a class="smart-result-card" href="${assetPath(entry.href)}">
          <span class="smart-result-media">${media}</span>
          <span class="smart-result-body">
            <span class="smart-result-type">${escapeHtml(smartSearchKindLabel(entry.tipo))}</span>
            <strong>${escapeHtml(entry.title)}</strong>
            <small>${escapeHtml(entry.subtitle || "Loner Mangá")}</small>
            ${entry.summary ? `<span class="smart-result-summary">${escapeHtml(entry.summary)}</span>` : ""}
          </span>
        </a>
      `;
    })
    .join("");
}

function renderSmartSearch(query) {
  if (!smartSearchResults || !smartSearchStatus) {
    return;
  }

  const normalizedQuery = smartSearchNormalize(query);
  const entries = smartSearchEntries();

  if (!normalizedQuery) {
    const recentEntries = catalogo.hqs
      .slice(-6)
      .reverse()
      .map((item) => smartSearchEntry(item, "hq"));

    smartSearchStatus.textContent = "Digite qualquer parte do título, personagem, universo, série, ano ou editora.";
    renderSmartResultCards(recentEntries);
    return;
  }

  const queryTokens = smartSearchTokens(normalizedQuery);
  const requiredMatches = Math.max(1, Math.ceil(queryTokens.length * 0.6));
  const matches = entries
    .map((entry) => smartSearchScore(entry, normalizedQuery, queryTokens))
    .filter((entry) => entry.score > 0 && entry.matchedTokens >= requiredMatches)
    .sort((first, second) => second.score - first.score || first.title.localeCompare(second.title, "pt-BR"))
    .slice(0, 18);

  smartSearchStatus.textContent =
    matches.length === 1 ? "1 resultado encontrado." : `${matches.length} resultados encontrados.`;
  renderSmartResultCards(matches);
}

function setupSmartSearchPage() {
  if (!smartSearchInput || !smartSearchResults) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  smartSearchInput.value = initialQuery;
  renderSmartSearch(initialQuery);
}

function updateSmartSearchUrl(query) {
  if (!smartSearchInput) {
    return;
  }

  const url = new URL(window.location.href);

  if (query) {
    url.searchParams.set("q", query);
  } else {
    url.searchParams.delete("q");
  }

  window.history.replaceState({}, "", url);
}

function filterUniverseCards(query) {
  const cards = Array.from(document.querySelectorAll(".universe-card"));

  if (!cards.length) {
    return;
  }

  const normalized = normalizeSearchText(query);
  let visibleCount = 0;

  cards.forEach((card) => {
    const searchable = normalizeSearchText(`${card.getAttribute("aria-label") || ""} ${card.textContent || ""}`);
    const isVisible = !normalized || searchable.includes(normalized);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (universeSearchStatus) {
    universeSearchStatus.textContent =
      visibleCount === 1 ? "1 mangá" : `${visibleCount} mangás`;
  }
}

function filterCharacterCards(query) {
  const cards = Array.from(document.querySelectorAll(".character-card"));

  if (!cards.length) {
    return;
  }

  const normalized = normalizeSearchText(query);
  let visibleCount = 0;

  cards.forEach((card) => {
    const searchable = normalizeSearchText(`${card.getAttribute("aria-label") || ""} ${card.textContent || ""}`);
    const isVisible = !normalized || searchable.includes(normalized);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  updateCharacterSearchStatus(visibleCount);
}

function isVolumePage() {
  return Boolean(currentComic());
}

function createVolumeActions() {
  if (!isVolumePage()) {
    return;
  }

  const article = document.querySelector(".article");
  const header = document.querySelector(".article-header");

  if (!article || !header || document.querySelector("#volumeActions")) {
    return;
  }

  volumeActions = document.createElement("div");
  volumeActions.className = "interaction-toolbar";
  volumeActions.id = "volumeActions";
  volumeActions.setAttribute("aria-label", "Ações da HQ");
  volumeActions.innerHTML = `
    <button class="button" type="button" data-comic-action="owned">Eu Tenho</button>
    <button class="button" type="button" data-comic-action="read">Eu Li</button>
    <button class="button ghost" type="button" id="readersButton">Já Leram (0)</button>
  `;
  article.insertBefore(volumeActions, header);
  readersButton = volumeActions.querySelector("#readersButton");
  updateVolumeActionsUi();
}

function createSeriesFavoriteAction() {
  if (!currentSeriesFavorite()) return;

  const article = document.querySelector(".article");
  const header = document.querySelector(".article-header");
  if (!article || !header || document.querySelector("#volumeActions")) return;

  volumeActions = document.createElement("div");
  volumeActions.className = "interaction-toolbar";
  volumeActions.id = "volumeActions";
  volumeActions.setAttribute("aria-label", "Ações do mangá");
  volumeActions.innerHTML = `<button class="button" type="button" data-comic-action="favorite">Favoritar</button>`;
  article.insertBefore(volumeActions, header);
  updateVolumeActionsUi();
}

function updateVolumeActionsUi() {
  if (!volumeActions) {
    return;
  }

  const loggedIn = Boolean(currentUser && currentProfile?.nick && firebaseServices && !currentProfile.firestoreBlocked);
  volumeActions.querySelectorAll("[data-comic-action]").forEach((button) => {
    const action = button.dataset.comicAction;
    const active = Boolean(currentInteraction[action === "owned" ? "owned" : action]);
    button.disabled = !loggedIn;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

async function awardReadXp() {
  if (!currentUser || !currentProfile) {
    return;
  }

  const comic = currentComic();
  const xpReward = Number(comic?.xpReward || comic?.pageCount || 0);
  const nextXp = Number(currentProfile.xp || 0) + xpReward;
  const nextLevel = levelFromXp(nextXp);

  await firebaseServices.setDoc(
    userRef(currentUser.uid),
    {
      xp: nextXp,
      level: nextLevel,
      updatedAt: firebaseServices.serverTimestamp()
    },
    { merge: true }
  );

  currentProfile = { ...currentProfile, xp: nextXp, level: nextLevel };
  renderSignedIn(currentProfile);
  renderProfilePage();
}

async function toggleComicAction(action) {
  if (!firebaseServices || !currentUser || !currentProfile?.nick || currentProfile.firestoreBlocked) {
    setMessage("Entre na conta para salvar esta HQ.", "error");
    return;
  }

  const comic = currentComic() || currentSeriesFavorite();

  if (!comic) {
    return;
  }

  const xpReward = Number(comic.xpReward || comic.pageCount || 0);
  const firestoreField = action === "owned" ? "owned" : action;
  const nextValue = !currentInteraction[firestoreField];
  const now = firebaseServices.serverTimestamp();
  const shouldAwardXp = action === "read" && nextValue && !currentInteraction.readXpGranted;
  const profileXp = Number(currentProfile.xp || 0) + (shouldAwardXp ? xpReward : 0);
  const basePayload = {
    uid: currentUser.uid,
    nick: currentProfile.nick,
    avatarPath: currentProfile.avatarPath || defaultAvatarPath,
    xp: profileXp,
    level: levelFromXp(profileXp),
    comicId: comic.id,
    title: comic.title,
    shortTitle: comic.shortTitle,
    universe: comic.universe,
    series: comic.series,
    href: comic.href,
    cover: comic.cover,
    pageCount: comic.pageCount,
    xpReward,
    seriesFavorite: Boolean(comic.seriesFavorite),
    updatedAt: now,
    [firestoreField]: nextValue
  };

  if (action === "read" && nextValue) {
    basePayload.readAt = now;

    if (shouldAwardXp) {
      basePayload.readXpGranted = true;
      basePayload.readXpAwarded = xpReward;
    }
  }

  if (action === "favorite" && nextValue) {
    basePayload.favoriteAt = now;
  }

  if (action === "owned" && nextValue) {
    basePayload.ownedAt = now;
  }

  await Promise.all([
    firebaseServices.setDoc(comicInteractionRef(comic.id, currentUser.uid), basePayload, { merge: true }),
    firebaseServices.setDoc(userComicRef(currentUser.uid, comic.id), basePayload, { merge: true })
  ]);

  if (shouldAwardXp) {
    await awardReadXp();
  }

  currentInteraction = { ...currentInteraction, ...basePayload };
  updateVolumeActionsUi();
}

function stopInteractionWatchers() {
  if (interactionUnsubscribe) {
    interactionUnsubscribe();
    interactionUnsubscribe = null;
  }

  if (readersUnsubscribe) {
    readersUnsubscribe();
    readersUnsubscribe = null;
  }
}

function watchVolumeData() {
  const comic = currentComic() || currentSeriesFavorite();

  if (!firebaseServices || !comic) {
    return;
  }

  if (readersUnsubscribe) {
    readersUnsubscribe();
  }

  if (readersButton) {
    readersUnsubscribe = firebaseServices.onSnapshot(
      firebaseServices.collection(firebaseServices.db, "comics", comic.id, "interactions"),
      (snapshot) => {
        const total = snapshot.docs.filter((item) => item.data().read).length;
        readersButton.textContent = `Já Leram (${total})`;
      }
    );
  }

  if (interactionUnsubscribe) {
    interactionUnsubscribe();
    interactionUnsubscribe = null;
  }

  if (!currentUser) {
    currentInteraction = {};
    updateVolumeActionsUi();
    return;
  }

  interactionUnsubscribe = firebaseServices.onSnapshot(
    comicInteractionRef(comic.id, currentUser.uid),
    (snapshot) => {
      currentInteraction = snapshot.exists() ? snapshot.data() : {};
      updateVolumeActionsUi();
    }
  );
}

async function openReadersModal() {
  if (!firebaseServices) {
    setMessage("Configure o Firebase para carregar os leitores.", "error");
    return;
  }

  const comic = currentComic();

  if (!comic) {
    return;
  }

  const existing = document.querySelector("#readersModal");
  existing?.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-backdrop";
  overlay.id = "readersModal";
  overlay.innerHTML = `
    <section class="modal-dialog readers-dialog" role="dialog" aria-modal="true" aria-labelledby="readersTitle">
      <div class="modal-header">
        <h2 id="readersTitle">Já Leram ${escapeHtml(comic.shortTitle)}</h2>
        <button class="button ghost" type="button" data-modal-close>Fechar</button>
      </div>
      <div class="reader-list" id="readerList" role="list">
        <p>Carregando leitores...</p>
      </div>
    </section>
  `;
  document.body.append(overlay);
  trapModalFocus(overlay);

  const list = overlay.querySelector("#readerList");
  const snapshot = await firebaseServices.getDocs(
    firebaseServices.collection(firebaseServices.db, "comics", comic.id, "interactions")
  );
  const readers = snapshot.docs
    .map((item) => item.data())
    .filter((item) => item.read)
    .sort((a, b) => timestampToMillis(b.readAt) - timestampToMillis(a.readAt))
    .slice(0, 25);

  if (!readers.length) {
    list.innerHTML = "<p>Nenhum usuário marcou leitura ainda.</p>";
    return;
  }

  list.innerHTML = readers
    .map((reader) => {
      const profile = xpProgress(reader);
      return `
        <button class="reader-row" type="button" data-profile-uid="${escapeHtml(reader.uid)}">
          <img src="${imageAssetPath(reader.avatarPath || defaultAvatarPath)}" alt="Avatar de ${escapeHtml(reader.nick || "Usuário")}" />
          <span>
            <strong>${escapeHtml(reader.nick || "Usuário")}</strong>
            <small>Level ${profile.level}</small>
          </span>
        </button>
      `;
    })
    .join("");
}

async function getPublicProfile(uid) {
  const snapshot = await firebaseServices.getDoc(userRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function getUserComicInteractions(uid) {
  const interactionsSnapshot = await firebaseServices.getDocs(
    firebaseServices.collection(firebaseServices.db, "users", uid, "comics")
  );

  return interactionsSnapshot.docs.map((item) => enrichedComicInteraction(item.data()));
}

function renderProfilePageUnavailable(
  title = "Perfil indisponível",
  text = "Para usar perfis, cole a configuração do Web App em firebase-config.js e publique as regras do Firestore."
) {
  if (!profilePage) {
    return;
  }

  profilePage.innerHTML = `
    <section class="content-band">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </section>
  `;
}

function profileStatCards(stats) {
  return `
    <div class="profile-stat-grid" aria-label="Resumo do perfil">
      <div>
        <strong>${formatNumber(stats.reads)}</strong>
        <span>Lidas</span>
      </div>
      <div>
        <strong>${formatNumber(stats.favorites)}</strong>
        <span>Favoritas</span>
      </div>
      <div>
        <strong>${formatNumber(stats.owned)}</strong>
        <span>Na coleção</span>
      </div>
      <div>
        <strong>${formatNumber(stats.pages)}</strong>
        <span>Páginas lidas</span>
      </div>
    </div>
  `;
}

function profileComicList(items, emptyText, dateField = "") {
  if (!items.length) {
    return `<p class="empty-state">${emptyText}</p>`;
  }

  return `
    <div class="profile-comic-grid">
      ${items
        .map((item) => {
          const comic = item.seriesFavorite ? item : enrichedComicInteraction(item);
          const date = formatShortDate(dateField ? comic[dateField] : comic.updatedAt);
          const meta = [comic.series || comic.universe, date].filter(Boolean).join(" - ");
          const cover = comic.cover ? imageAssetPath(comic.cover) : imageAssetPath("lonermangalogo.png");

          return `
            <a class="profile-comic-card" href="${assetPath(comic.href)}">
              <img
                src="${cover}"
                alt="Capa de ${escapeHtml(comic.shortTitle || comic.title)}"
                loading="lazy"
              />
              <span>
                <strong>${escapeHtml(comic.shortTitle || comic.title)}</strong>
                <small>${escapeHtml(meta || "Mangá")}</small>
              </span>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function profileAchievementGroups() {
  return profileAvatarRewards.reduce((groups, reward) => {
    let group = groups.find((item) => item.id === reward.tabId);

    if (!group) {
      group = {
        id: reward.tabId,
        title: reward.tabTitle,
        rewards: []
      };
      groups.push(group);
    }

    group.rewards.push(reward);
    return groups;
  }, []);
}

function profileAvatarRewardButton(reward, state, profile, isOwnProfile) {
  if (!isOwnProfile) {
    return "";
  }

  if (!state.unlocked) {
    return '<button class="button ghost" type="button" disabled>Bloqueado</button>';
  }

  if ((profile.avatarPath || defaultAvatarPath) === reward.avatarPath) {
    return '<button class="button ghost" type="button" disabled>Em uso</button>';
  }

  return `
    <button class="button primary" type="button" data-profile-avatar="${escapeHtml(reward.avatarPath)}">
      Usar avatar
    </button>
  `;
}

function profileAchievementCard(reward, interactions, profile, isOwnProfile) {
  const state = profileAchievementState(interactions, reward);
  const countLabel = `${Math.min(state.current, state.required)} / ${state.required} lidas`;
  const statusText = state.unlocked ? "Desbloqueada" : countLabel;

  return `
    <article class="achievement-card ${state.unlocked ? "is-unlocked" : "is-locked"}">
      <img
        class="achievement-avatar"
        src="${imageAssetPath(reward.avatarPath)}"
        alt="Avatar ${escapeHtml(reward.avatarName)}"
        loading="lazy"
      />
      <div class="achievement-copy">
        <span class="achievement-kicker">${escapeHtml(reward.tabTitle)}</span>
        <h4>${escapeHtml(reward.title)}</h4>
        <p>${escapeHtml(reward.description)}</p>
        <div class="achievement-meter" aria-label="Progresso da conquista">
          <span style="width: ${state.percent}%"></span>
        </div>
        <small>Progresso: ${escapeHtml(countLabel)}</small>
      </div>
      <div class="achievement-reward">
        <span class="achievement-status">${escapeHtml(statusText)}</span>
        <strong>Avatar ${escapeHtml(reward.avatarName)}</strong>
        ${profileAvatarRewardButton(reward, state, profile, isOwnProfile)}
      </div>
    </article>
  `;
}

function profileAchievementsPanel(interactions, profile, isOwnProfile) {
  const groups = profileAchievementGroups();

  return `
    <section class="profile-achievements" aria-labelledby="profileAchievementsTitle">
      <h3 id="profileAchievementsTitle">Conquistas</h3>
      <div class="achievement-tabs" role="tablist" aria-label="Universos de conquistas">
        ${groups
          .map(
            (group, index) => `
              <button
                class="achievement-tab ${index === 0 ? "is-active" : ""}"
                type="button"
                role="tab"
                aria-selected="${index === 0 ? "true" : "false"}"
                aria-controls="achievement-panel-${escapeHtml(group.id)}"
                data-achievement-tab="${escapeHtml(group.id)}"
              >
                ${escapeHtml(group.title)}
              </button>
            `
          )
          .join("")}
      </div>
      ${groups
        .map(
          (group, index) => `
            <div
              class="achievement-panel"
              id="achievement-panel-${escapeHtml(group.id)}"
              role="tabpanel"
              data-achievement-panel="${escapeHtml(group.id)}"
              ${index === 0 ? "" : "hidden"}
            >
              <div class="achievement-list">
                ${group.rewards
                  .map((reward) => profileAchievementCard(reward, interactions, profile, isOwnProfile))
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </section>
  `;
}

function activateProfileTab(tabId) {
  if (!profilePage) {
    return;
  }

  profilePage.querySelectorAll("[data-profile-tab]").forEach((button) => {
    const active = button.dataset.profileTab === tabId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  profilePage.querySelectorAll("[data-profile-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.profilePanel !== tabId;
  });
}

function activateAchievementTab(tabId) {
  if (!profilePage) {
    return;
  }

  profilePage.querySelectorAll("[data-achievement-tab]").forEach((button) => {
    const active = button.dataset.achievementTab === tabId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  profilePage.querySelectorAll("[data-achievement-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.achievementPanel !== tabId;
  });
}

async function renderProfilePage() {
  if (!profilePage || !firebaseServices) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid") || currentUser?.uid;

  if (!uid) {
    profilePage.innerHTML = `
      <section class="content-band">
        <h2>Meu Perfil</h2>
        <p>Entre na sua conta para abrir seu perfil da Loner Mangá.</p>
      </section>
    `;
    return;
  }

  const profile = await getPublicProfile(uid);

  if (!profile || !profile.nick) {
    profilePage.innerHTML = `
      <section class="content-band">
        <h2>Perfil</h2>
        <p>Esse usuário ainda não escolheu um Nick público.</p>
      </section>
    `;
    return;
  }

  const interactions = await getUserComicInteractions(uid);
  const reads = interactions
    .filter((item) => item.read)
    .sort((a, b) => timestampToMillis(b.readAt) - timestampToMillis(a.readAt))
    .slice(0, 6);
  const favorites = interactions
    .filter((item) => item.favorite && item.seriesFavorite)
    .sort((a, b) => timestampToMillis(b.favoriteAt) - timestampToMillis(a.favoriteAt))
    .slice(0, 12);
  const progress = xpProgress(profile);
  const isOwnProfile = currentUser?.uid === uid && !currentProfile?.firestoreBlocked;
  const stats = {
    reads: interactions.filter((item) => item.read).length,
    favorites: interactions.filter((item) => item.favorite && item.seriesFavorite).length,
    owned: interactions.filter((item) => item.owned).length,
    pages: interactions.filter((item) => item.read).reduce((total, item) => total + Number(item.pageCount || 0), 0)
  };

  profilePage.innerHTML = `
    <section class="profile-page-card">
      <div class="profile-hero">
        <img class="profile-avatar large" src="${imageAssetPath(profile.avatarPath || defaultAvatarPath)}" alt="Avatar de ${escapeHtml(profile.nick)}" />
        <div>
          <h2>${escapeHtml(profile.nick)}</h2>
          <p>Level ${progress.level}</p>
          <div class="xp-meter wide" aria-label="Barra de XP">
            <span style="width: ${progress.percent}%"></span>
          </div>
          <small>${progress.current} / ${progress.next} XP para o próximo level</small>
        </div>
      </div>

      ${profileStatCards(stats)}

      <div class="profile-tabs" role="tablist" aria-label="Áreas do perfil">
        <button
          class="profile-tab is-active"
          type="button"
          role="tab"
          aria-selected="true"
          aria-controls="profile-panel-readings"
          data-profile-tab="readings"
        >
          Leituras
        </button>
        <button
          class="profile-tab"
          type="button"
          role="tab"
          aria-selected="false"
          aria-controls="profile-panel-achievements"
          data-profile-tab="achievements"
        >
          Conquistas
        </button>
      </div>

      <div class="profile-tab-panel" id="profile-panel-readings" role="tabpanel" data-profile-panel="readings">
        <div class="profile-sections">
          <section>
            <h3>Últimos mangás lidos</h3>
            ${profileComicList(reads, "Ainda não marcou nenhuma leitura.", "readAt")}
          </section>
          <section>
            <h3>Mangás favoritos</h3>
            ${profileComicList(favorites, "Ainda não favoritou nenhuma HQ.", "favoriteAt")}
          </section>
        </div>
      </div>

      <div
        class="profile-tab-panel"
        id="profile-panel-achievements"
        role="tabpanel"
        data-profile-panel="achievements"
        hidden
      >
        ${profileAchievementsPanel(interactions, profile, isOwnProfile)}
      </div>
    </section>
  `;
}

async function setProfileAvatar(avatarPath) {
  if (!firebaseServices || !currentUser || !currentProfile?.nick || currentProfile.firestoreBlocked) {
    setMessage("Entre na conta para alterar o avatar.", "error");
    return;
  }

  const interactions = await getUserComicInteractions(currentUser.uid);
  const unlockedAvatars = unlockedProfileAvatarPaths(interactions);

  if (avatarPath !== defaultAvatarPath && !unlockedAvatars.includes(avatarPath)) {
    setMessage("Esse avatar ainda está bloqueado.", "error");
    renderProfilePage();
    return;
  }

  await firebaseServices.setDoc(
    userRef(currentUser.uid),
    {
      uid: currentUser.uid,
      avatarPath,
      updatedAt: firebaseServices.serverTimestamp()
    },
    { merge: true }
  );

  currentProfile = {
    ...currentProfile,
    avatarPath
  };

  renderSignedIn(currentProfile);
  await renderProfilePage();
  renderRankingPage();
  setMessage("Avatar atualizado no perfil.", "success");
}

function renderRankingPageUnavailable(
  title = "Ranking indisponível",
  text = "Para carregar o ranking, o Firebase precisa estar configurado e as regras públicas de leitura precisam estar publicadas."
) {
  if (!rankingPage) {
    return;
  }

  rankingPage.innerHTML = `
    <section class="content-band">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
    </section>
  `;
}

function sortedRankingProfiles(profiles) {
  return profiles
    .filter((profile) => profile?.uid && profile?.nick)
    .map((profile) => {
      const progress = xpProgress(profile);
      return {
        ...profile,
        level: progress.level,
        xp: progress.xp,
        progress
      };
    })
    .sort((first, second) => {
      if (second.level !== first.level) {
        return second.level - first.level;
      }

      if (second.xp !== first.xp) {
        return second.xp - first.xp;
      }

      return String(first.nick).localeCompare(String(second.nick), "pt-BR", { sensitivity: "base" });
    });
}

async function renderRankingPage() {
  if (!rankingPage || !firebaseServices) {
    return;
  }

  try {
    const snapshot = await firebaseServices.getDocs(firebaseServices.collection(firebaseServices.db, "users"));
    const ranking = sortedRankingProfiles(snapshot.docs.map((item) => item.data()));

    if (!ranking.length) {
      rankingPage.innerHTML = `
        <section class="content-band">
          <h2>Ranking vazio</h2>
          <p>Nenhum usuário com nick público apareceu por aqui ainda.</p>
        </section>
      `;
      return;
    }

    const leader = ranking[0];
    const totalXp = ranking.reduce((total, profile) => total + Number(profile.xp || 0), 0);

    rankingPage.innerHTML = `
      <section class="ranking-board" aria-labelledby="rankingTitle">
        <div class="ranking-header">
          <div>
            <h2 id="rankingTitle">Ranking geral</h2>
            <p>Ordenado por level e XP acumulado nos mangás lidos.</p>
          </div>
          <div class="ranking-summary" aria-label="Resumo do ranking">
            <span><strong>${formatNumber(ranking.length)}</strong> usuários</span>
            <span><strong>Level ${leader.level}</strong> líder</span>
            <span><strong>${formatNumber(totalXp)}</strong> XP total</span>
          </div>
        </div>

        <div class="ranking-list" role="list">
          ${ranking
            .map((profile, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUser?.uid === profile.uid;

              return `
                <a
                  class="ranking-row${rank <= 3 ? " top-rank" : ""}${isCurrentUser ? " current-user" : ""}"
                  href="${pagePath("perfil.html", { uid: profile.uid })}"
                  role="listitem"
                >
                  <span class="ranking-position">#${rank}</span>
                  <img src="${imageAssetPath(profile.avatarPath || defaultAvatarPath)}" alt="Avatar de ${escapeHtml(profile.nick)}" />
                  <span class="ranking-user">
                    <strong>${escapeHtml(profile.nick)}${isCurrentUser ? " - você" : ""}</strong>
                    <small>Level ${profile.level} - ${formatNumber(profile.xp)} XP</small>
                    <span class="xp-meter" aria-label="Progresso de XP">
                      <span style="width: ${profile.progress.percent}%"></span>
                    </span>
                  </span>
                </a>
              `;
            })
            .join("")}
        </div>
      </section>
    `;
  } catch (error) {
    console.error(error);
    renderRankingPageUnavailable("Ranking bloqueado", dataErrorMessage(error));
  }
}

function openProfile(uid) {
  window.location.assign(pagePath("perfil.html", { uid }));
}

async function signInWithGoogle() {
  try {
    if (!firebaseServices) {
      await loadFirebase();
    }

    if (!firebaseServices) {
      setFirebaseUnavailable();
      return;
    }

    const originWarning = loginOriginWarning();

    if (originWarning) {
      setMessage(originWarning, "error");
      return;
    }

    pendingAuthError = "";
    setMessage("Abrindo login do Google...", "success");
    await firebaseServices.signInWithPopup(
      firebaseServices.auth,
      createGoogleProvider(),
      firebaseServices.browserPopupRedirectResolver
    );
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      try {
        setMessage("Redirecionando para o Google...", "success");
        await firebaseServices.signInWithRedirect(
          firebaseServices.auth,
          createGoogleProvider(),
          firebaseServices.browserPopupRedirectResolver
        );
      } catch (redirectError) {
        pendingAuthError = authErrorMessage(redirectError);
        setMessage(pendingAuthError, "error");
      }
      return;
    }

    pendingAuthError = authErrorMessage(error);
    setMessage(pendingAuthError, "error");
  }
}

function setupEvents() {
  showRegister?.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
    setMessage("Cadastro com e-mail e senha pelo Firebase.");
  });

  showLogin?.addEventListener("click", () => {
    registerForm.hidden = true;
    loginForm.hidden = false;
    setMessage("Entre com e-mail e senha ou Google.");
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!firebaseServices) {
      setFirebaseUnavailable();
      return;
    }

    const formData = new FormData(loginForm);
    const email = String(formData.get("usuario")).trim();
    const password = String(formData.get("senha"));

    try {
      await firebaseServices.signInWithEmailAndPassword(firebaseServices.auth, email, password);
      loginForm.reset();
      setMessage("Login realizado.", "success");
    } catch (error) {
      setMessage(authErrorMessage(error), "error");
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!firebaseServices) {
      setFirebaseUnavailable();
      return;
    }

    const formData = new FormData(registerForm);
    const email = String(formData.get("novoUsuario")).trim();
    const password = String(formData.get("novaSenha"));
    const confirmation = String(formData.get("confirmarSenha"));

    if (password !== confirmation) {
      setMessage("As senhas não conferem.", "error");
      return;
    }

    try {
      await firebaseServices.createUserWithEmailAndPassword(firebaseServices.auth, email, password);
      registerForm.reset();
      setMessage("Conta criada. Agora escolha seu Nick.", "success");
    } catch (error) {
      setMessage(authErrorMessage(error), "error");
    }
  });

  const debouncedRenderSearchResults = debounce(renderSearchResults, searchDebounceDelay);
  const debouncedRenderSmartSearch = debounce(renderSmartSearch, searchDebounceDelay);
  const debouncedFilterUniverseCards = debounce(filterUniverseCards, searchDebounceDelay);
  const debouncedFilterCharacterCards = debounce(filterCharacterCards, searchDebounceDelay);

  searchInput?.addEventListener("input", (event) => {
    debouncedRenderSearchResults(event.target.value);
  });

  searchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearchResults(searchInput.value);
  });

  smartSearchInput?.addEventListener("input", (event) => {
    debouncedRenderSmartSearch(event.target.value);
  });

  smartSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = smartSearchInput.value.trim();
    renderSmartSearch(query);
    updateSmartSearchUrl(query);
  });

  universeSearchInput?.addEventListener("input", (event) => {
    debouncedFilterUniverseCards(event.target.value);
  });

  characterSearchInput?.addEventListener("input", (event) => {
    debouncedFilterCharacterCards(event.target.value);
  });

  document.addEventListener("click", async (event) => {
    const articleButton = event.target.closest("[data-open-article]");
    const sectionLink = event.target.closest("[data-section]");
    const navigationLink = event.target.closest("a[href]");
    const smartSuggestionButton = event.target.closest("[data-smart-query]");
    const logoutButton = event.target.closest("#logoutButton");
    const googleButton = event.target.closest("#googleLoginButton");
    const profileButton = event.target.closest("#openMyProfile");
    const comicAction = event.target.closest("[data-comic-action]");
    const modalClose = event.target.closest("[data-modal-close]");
    const readerButton = event.target.closest("#readersButton");
    const profileUserButton = event.target.closest("[data-profile-uid]");
    const profileTabButton = event.target.closest("[data-profile-tab]");
    const achievementTabButton = event.target.closest("[data-achievement-tab]");
    const profileAvatarButton = event.target.closest("[data-profile-avatar]");

    if (articleButton) {
      renderArticle(articleButton.dataset.openArticle);
      if (searchResults) {
        searchResults.hidden = true;
      }
      articleContent?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (sectionLink) {
      setActiveSection(sectionLink.dataset.section);
    }

    if (shouldSmoothNavigate(navigationLink, event)) {
      event.preventDefault();
      leavePage(navigationLink.href);
      return;
    }

    if (smartSuggestionButton && smartSearchInput) {
      const query = smartSuggestionButton.dataset.smartQuery || "";
      smartSearchInput.value = query;
      renderSmartSearch(query);
      updateSmartSearchUrl(query);
      smartSearchInput.focus();
    }

    if (logoutButton && firebaseServices) {
      clearCachedProfile();
      await firebaseServices.signOut(firebaseServices.auth);
      setMessage("Você saiu da conta.");
    }

    if (googleButton) {
      event.preventDefault();
      await signInWithGoogle();
      return;
    }

    if (profileButton && currentUser) {
      openProfile(currentUser.uid);
    }

    if (comicAction) {
      await toggleComicAction(comicAction.dataset.comicAction);
    }

    if (readerButton) {
      await openReadersModal();
    }

    if (profileUserButton) {
      openProfile(profileUserButton.dataset.profileUid);
    }

    if (profileTabButton) {
      activateProfileTab(profileTabButton.dataset.profileTab);
    }

    if (achievementTabButton) {
      activateAchievementTab(achievementTabButton.dataset.achievementTab);
    }

    if (profileAvatarButton) {
      await setProfileAvatar(profileAvatarButton.dataset.profileAvatar);
    }

    if (modalClose) {
      closeModal(modalClose.closest(".modal-backdrop"));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (searchResults) {
        searchResults.hidden = true;
      }
      document.querySelectorAll(".modal-backdrop").forEach((modal) => closeModal(modal));
    }
  });
}

function authErrorMessage(error) {
  const code = error?.code || "";

  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "E-mail ou senha incorretos.";
  }

  if (code.includes("auth/user-not-found")) {
    return "Usuário não encontrado.";
  }

  if (code.includes("auth/email-already-in-use")) {
    return "Esse e-mail já está cadastrado.";
  }

  if (code.includes("auth/popup-closed-by-user") || code.includes("auth/redirect-cancelled-by-user")) {
    return "O login do Google foi fechado antes de terminar.";
  }

  if (code.includes("auth/cancelled-popup-request")) {
    return "Já existe uma janela de login do Google aberta.";
  }

  if (code.includes("auth/popup-blocked")) {
    return "O navegador bloqueou a janela do Google. Libere popup para localhost ou tente de novo.";
  }

  if (code.includes("auth/unauthorized-domain")) {
    return "Domínio não autorizado. Abra por localhost ou adicione este domínio no Firebase Auth.";
  }

  if (code.includes("auth/operation-not-allowed")) {
    return "Ative e salve o provedor Google em Authentication > Sign-in method, com nome público do projeto e e-mail de suporte.";
  }

  if (code.includes("auth/configuration-not-found")) {
    return "O Firebase Auth ainda não está configurado nesse projeto.";
  }

  if (code.includes("auth/api-key-not-valid")) {
    return "A apiKey do Firebase está incorreta.";
  }

  if (code.includes("auth/account-exists-with-different-credential")) {
    return "Esse e-mail já existe com outro método de login.";
  }

  return "Não foi possível concluir o login agora.";
}

function dataErrorMessage(error) {
  const code = error?.code || "";

  if (code.includes("permission-denied")) {
    return "Login feito, mas o Firestore bloqueou o perfil. Publique as regras do arquivo firestore.rules no Firebase.";
  }

  if (code.includes("unavailable")) {
    return "Login feito, mas o Firestore não respondeu agora. Tente de novo em instantes.";
  }

  return "Login feito, mas não foi possível carregar seu perfil.";
}

function setupArcsDialogs() {
  document.querySelectorAll("[data-arcs-dialog]").forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.arcsDialog);
    if (!(dialog instanceof HTMLDialogElement)) return;

    const closeButton = dialog.querySelector("[data-dialog-close]");
    const closeDialog = () => {
      dialog.close();
      document.body.classList.remove("dialog-open");
    };

    trigger.addEventListener("click", () => {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    });
    closeButton?.addEventListener("click", closeDialog);
    dialog.addEventListener("cancel", () => document.body.classList.remove("dialog-open"));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });
  });
}

async function startAuth() {
  try {
    await loadFirebase();
  } catch (error) {
    console.error(error);
    setMessage("Não foi possível carregar o Firebase.", "error");
    renderRankingPageUnavailable("Ranking indisponível", "Não foi possível carregar o Firebase agora.");
    return;
  }

  if (!firebaseServices) {
    renderRankingPageUnavailable();
    return;
  }

  try {
    await firebaseServices.getRedirectResult(firebaseServices.auth, firebaseServices.browserPopupRedirectResolver);
  } catch (error) {
    pendingAuthError = authErrorMessage(error);
    setMessage(pendingAuthError, "error");
  }

  firebaseServices.onAuthStateChanged(firebaseServices.auth, async (user) => {
    currentUser = user;

    if (!user) {
      currentProfile = null;
      currentInteraction = {};
      clearCachedProfile();
      stopInteractionWatchers();
      renderSignedOut();
      watchVolumeData();
      renderProfilePage();
      renderRankingPage();
      updateVolumeActionsUi();
      return;
    }

    try {
      pendingAuthError = "";
      const baseProfile = await ensureProfile(user);
      currentProfile = await ensureNick(user, baseProfile);
      renderSignedIn(currentProfile);
      watchVolumeData();
      renderProfilePage();
      renderRankingPage();
      updateVolumeActionsUi();
    } catch (error) {
      console.error(error);
      currentProfile = temporaryProfileFromAuth(user);
      renderSignedIn(currentProfile);
      watchVolumeData();
      renderProfilePageUnavailable("Perfil bloqueado", dataErrorMessage(error));
      renderRankingPageUnavailable("Ranking bloqueado", dataErrorMessage(error));
      updateVolumeActionsUi();
      setMessage(dataErrorMessage(error), "error");
    }
  });
}

normalizeAuthForms();
renderHomeRecentHqs();
renderCharacterIndex();
setupSmartSearchPage();
setupArcsDialogs();
setupEvents();
createVolumeActions();
createSeriesFavoriteAction();
startAuth();
