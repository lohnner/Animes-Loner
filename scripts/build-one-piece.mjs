import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../Mangás/One Piece/", import.meta.url);
const volumes = JSON.parse(await readFile(new URL("one-piece-volumes.json", import.meta.url), "utf8"));
const baseUrl = "https://lohnner.github.io/Animes-Loner/Mang%C3%A1s/One%20Piece";

const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
};

const arcText = (chapter) => {
  if (chapter <= 100) return "a formação dos Piratas do Chapéu de Palha e suas aventuras no East Blue";
  if (chapter <= 217) return "a entrada na Grand Line e o confronto contra a Baroque Works em Alabasta";
  if (chapter <= 302) return "a jornada pelas ilhas do céu e os conflitos de Skypiea";
  if (chapter <= 441) return "os acontecimentos de Water 7, Enies Lobby e o resgate de Nico Robin";
  if (chapter <= 597) return "a travessia por Thriller Bark, Sabaody, Impel Down e a Guerra de Marineford";
  if (chapter <= 653) return "o reencontro da tripulação e a aventura na Ilha dos Homens-Peixe";
  if (chapter <= 801) return "a aliança pirata e os confrontos de Punk Hazard e Dressrosa";
  if (chapter <= 908) return "os acontecimentos de Zou, Whole Cake Island e do Levely";
  if (chapter <= 1057) return "a grande batalha no País de Wano contra Kaido e seus aliados";
  if (chapter <= 1125) return "os mistérios tecnológicos, políticos e históricos revelados em Egghead";
  return "a chegada dos Chapéus de Palha a Elbaph e os segredos ligados aos gigantes, Loki e ao passado do mundo";
};

const shellStart = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><meta name="twitter:card" content="summary_large_image"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const shellEnd = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;

const volumeCards = volumes.map(({ number, releaseDate }) => {
  const year = releaseDate.slice(0, 4);
  return `<a class="volume-card" href="one-piece-${number}-${year}.html"><img src="One%20Piece%20%23${number}.png" alt="Capa do volume ${number} de One Piece"/><span>Volume ${number}</span></a>`;
}).join("");

const seriesDescription = "Mangá de aventura criado por Eiichiro Oda sobre Monkey D. Luffy e os Piratas do Chapéu de Palha em busca do lendário One Piece.";
const seriesPage = `${shellStart("One Piece", seriesDescription, `${baseUrl}/one-piece.html`, `${baseUrl}/One%20Piece%20%231.png`)}<main class="wiki-page universe-layout"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><span>One Piece</span></nav><header class="article-header"><h1>One Piece</h1><p class="lead">Mangá de aventura criado por Eiichiro Oda sobre Monkey D. Luffy, um jovem pirata que deseja encontrar o lendário One Piece e se tornar o Rei dos Piratas.</p></header><section class="content-band"><h2>Resumo do Mangá</h2><p>Na Grande Era dos Piratas, aventureiros de todo o mundo partem para o mar em busca do One Piece, o tesouro deixado por Gol D. Roger. Inspirado por Shanks, Luffy ganha poderes elásticos após comer uma Fruta do Diabo e decide formar sua própria tripulação.</p><p>Ao lado dos Piratas do Chapéu de Palha, Luffy atravessa ilhas extraordinárias, enfrenta marinheiros e poderosos adversários e desvenda os mistérios do mundo enquanto navega pela Grand Line.</p></section><section class="content-band"><h2>Informações do Mangá</h2><table class="data-table"><tbody><tr><th>Autor</th><td>Eiichiro Oda</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>1997 – presente</td></tr><tr><th>Volumes</th><td>${volumes.length}</td></tr><tr><th>Capítulos compilados</th><td>1 a ${volumes.at(-1).chapters[1]}</td></tr></tbody></table></section><section class="content-band"><h2>Volumes</h2><div class="volume-gallery">${volumeCards}</div></section></article></main>${shellEnd}`;
await writeFile(new URL("one-piece.html", output), seriesPage);

for (const { number, releaseDate, chapters } of volumes) {
  const year = releaseDate.slice(0, 4);
  const [startChapter, endChapter] = chapters;
  const title = `One Piece / Volume ${number}`;
  const description = `Volume ${number} de One Piece, de Eiichiro Oda, reunindo os capítulos ${startChapter} a ${endChapter}.`;
  const file = `one-piece-${number}-${year}.html`;
  const cover = `One%20Piece%20%23${number}.png`;
  const page = `${shellStart(title, description, `${baseUrl}/${file}`, `${baseUrl}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="one-piece.html">One Piece</a><span>/</span><span>Volume ${number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume acompanha ${arcText(startChapter)}.</p><p>A aventura amplia a jornada de Luffy e seus companheiros, combinando ação, humor, emoção e novos mistérios sobre o mundo criado por Eiichiro Oda.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>One Piece #${number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Roteiro</th><td>Eiichiro Oda</td></tr><tr><th>Arte</th><td>Eiichiro Oda</td></tr><tr><th>Série</th><td><a href="one-piece.html">One Piece</a></td></tr><tr><th>Capítulos</th><td>${startChapter} a ${endChapter}</td></tr><tr><th>Formato</th><td>Tankōbon</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${number} de One Piece"/><table><tbody><tr><th>Universo</th><td>One Piece</td></tr><tr><th>Série</th><td>One Piece</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr></tbody></table></aside></main>${shellEnd}`;
  await writeFile(new URL(file, output), page);
}

const catalogPath = new URL("../catalogo.js", import.meta.url);
let catalog = await readFile(catalogPath, "utf8");
catalog = catalog.replace(/\n  \{\n    tipo: "hq",\n    id: "one-piece-1-1997",[\s\S]*?\n  \},/, "");
const markerStart = "  // ONE_PIECE_COMPLETE_CATALOG";
const markerEnd = "  // ONE_PIECE_COMPLETE_CATALOG_END";
const catalogEntries = volumes.map(({ number, releaseDate, chapters }) => {
  const year = releaseDate.slice(0, 4);
  return `  { tipo: "hq", id: "one-piece-${number}-${year}", title: "One Piece / Volume ${number}", shortTitle: "One Piece / Volume ${number}", universe: "One Piece", series: "One Piece", href: "Mangás/One%20Piece/one-piece-${number}-${year}.html", cover: "Mangás/One%20Piece/One%20Piece%20%23${number}.png", pageCount: 200, xpReward: 200, fileName: "one-piece-${number}-${year}.html", publicationDate: "${formatDate(releaseDate)}", chapters: "${chapters[0]} a ${chapters[1]}", keywords: ["One Piece", "Volume ${number}", "Monkey D. Luffy", "Eiichiro Oda", "Shueisha", "piratas", "Grand Line"] },`;
}).join("\n");
const catalogBlock = `${markerStart}\n${catalogEntries}\n${markerEnd}\n`;
const existingBlock = new RegExp(`  // ONE_PIECE_COMPLETE_CATALOG[\\s\\S]*?  // ONE_PIECE_COMPLETE_CATALOG_END\\n`);
if (existingBlock.test(catalog)) catalog = catalog.replace(existingBlock, catalogBlock);
else catalog = catalog.replace("  // BERSERK_COMPLETE_CATALOG", `${catalogBlock}  // BERSERK_COMPLETE_CATALOG`);
await writeFile(catalogPath, catalog);

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>[^<]*One%20Piece[^<]*<\/loc>\s*<\/url>/g, "");
const sitemapEntries = [`  <url><loc>${baseUrl}/one-piece.html</loc></url>`, ...volumes.map(({ number, releaseDate }) => `  <url><loc>${baseUrl}/one-piece-${number}-${releaseDate.slice(0, 4)}.html</loc></url>`)].join("\n");
sitemap = sitemap.replace("</urlset>", `${sitemapEntries}\n</urlset>`);
await writeFile(sitemapPath, sitemap);

console.log(`One Piece: ${volumes.length} volumes, páginas, catálogo e sitemap preparados.`);
