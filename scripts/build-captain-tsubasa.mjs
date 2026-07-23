import { mkdir, readFile, writeFile } from "node:fs/promises";

const output = new URL("../Mangás/Captain Tsubasa/", import.meta.url);
const volumes = JSON.parse(await readFile(new URL("captain-tsubasa-volumes.json", import.meta.url), "utf8"));
const baseUrl = "https://lohnner.github.io/Animes-Loner/Mang%C3%A1s/Captain%20Tsubasa";
await mkdir(output, { recursive: true });

const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
};

const arcName = (chapter) => chapter <= 50
  ? "o arco Kids' Dream, acompanhando Tsubasa no ensino fundamental e a formação da equipe Nankatsu"
  : chapter <= 85
    ? "o arco Boys' Fight, com o campeonato nacional do ensino médio e novos confrontos contra os maiores rivais do Japão"
    : "o arco J Boys' Challenge, no qual a seleção japonesa juvenil enfrenta adversários internacionais";

const shellStart = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><meta name="twitter:card" content="summary_large_image"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const shellEnd = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;

const cards = volumes.map(({ number, releaseDate }) =>
  `<a class="volume-card" href="captain-tsubasa-${number}-${releaseDate.slice(0, 4)}.html"><img src="Captain%20Tsubasa%20%23${number}.png" alt="Capa do volume ${number} de Captain Tsubasa" loading="lazy"/><span>Volume ${number}</span></a>`
).join("");

const description = "Mangá esportivo criado por Yōichi Takahashi sobre Tsubasa Ozora, um jovem prodígio que sonha em conquistar o mundo através do futebol.";
const arcsDialog = `<dialog class="arcs-dialog" id="captainTsubasaArcsDialog" aria-labelledby="captainTsubasaArcsDialogTitle"><div class="arcs-dialog-header"><h2 id="captainTsubasaArcsDialogTitle">Arcos de Captain Tsubasa</h2><button class="dialog-close" type="button" data-dialog-close aria-label="Fechar">&times;</button></div><div class="arcs-table-wrap"><table class="data-table arcs-table"><thead><tr><th>Nº</th><th>Arco</th><th>Início</th><th>Fim</th></tr></thead><tbody><tr><td>1</td><td>Kids' Dream</td><td>1</td><td>50</td></tr><tr><td>2</td><td>Boys' Fight</td><td>51</td><td>85</td></tr><tr><td>3</td><td>J Boys' Challenge</td><td>86</td><td>114</td></tr></tbody></table></div></dialog>`;
const seriesPage = `${shellStart("Captain Tsubasa", description, `${baseUrl}/captain-tsubasa.html`, `${baseUrl}/Captain%20Tsubasa%20%231.png`)}<main class="wiki-page universe-layout"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><span>Captain Tsubasa</span></nav><header class="article-header"><h1>Captain Tsubasa</h1><p class="lead">Mangá esportivo de Yōichi Takahashi sobre Tsubasa Ozora, um jovem apaixonado por futebol que deseja se tornar profissional e conquistar o mundo defendendo o Japão.</p></header><section class="content-band"><h2>Resumo do Mangá</h2><p>Após se mudar para Nankatsu, Tsubasa conhece jogadores que transformam sua relação com o futebol, entre eles o goleiro Genzo Wakabayashi e o parceiro Taro Misaki. Seu talento, determinação e amor pelo esporte conduzem a equipe por campeonatos cada vez mais difíceis.</p><p>A série acompanha a evolução de Tsubasa e de seus grandes rivais, como Kojiro Hyuga, desde os torneios escolares até a formação da seleção japonesa juvenil.</p></section><section class="content-band"><h2>Informações do Mangá</h2><table class="data-table"><tbody><tr><th>Autor</th><td>Yōichi Takahashi</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>1981 – 1988</td></tr><tr><th>Volumes</th><td>37</td></tr><tr><th>Arcos</th><td><button class="text-action" type="button" data-arcs-dialog="captainTsubasaArcsDialog">Ver Completo</button></td></tr></tbody></table></section><section class="content-band"><h2>Volumes</h2><div class="volume-gallery">${cards}</div></section>${arcsDialog}</article></main>${shellEnd}`;
await writeFile(new URL("captain-tsubasa.html", output), seriesPage);

for (const { number, releaseDate, chapters } of volumes) {
  const year = releaseDate.slice(0, 4);
  const [startChapter, endChapter] = chapters;
  const title = `Captain Tsubasa / Volume ${number}`;
  const description = `Volume ${number} de Captain Tsubasa, de Yōichi Takahashi, reunindo os capítulos ${startChapter} a ${endChapter}.`;
  const file = `captain-tsubasa-${number}-${year}.html`;
  const cover = `Captain%20Tsubasa%20%23${number}.png`;
  const page = `${shellStart(title, description, `${baseUrl}/${file}`, `${baseUrl}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="captain-tsubasa.html">Captain Tsubasa</a><span>/</span><span>Volume ${number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume desenvolve ${arcName(startChapter)}.</p><p>A história destaca o crescimento técnico e pessoal dos jogadores, as estratégias dentro de campo e a determinação de Tsubasa em aproximar o Japão do futebol mundial.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>Captain Tsubasa #${number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Roteiro</th><td>Yōichi Takahashi</td></tr><tr><th>Arte</th><td>Yōichi Takahashi</td></tr><tr><th>Série</th><td><a href="captain-tsubasa.html">Captain Tsubasa</a></td></tr><tr><th>Capítulos</th><td>${startChapter} a ${endChapter}</td></tr><tr><th>Páginas</th><td>192 páginas</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${number} de Captain Tsubasa"/><table><tbody><tr><th>Universo</th><td>Captain Tsubasa</td></tr><tr><th>Série</th><td>Captain Tsubasa</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr></tbody></table></aside></main>${shellEnd}`;
  await writeFile(new URL(file, output), page);
}

const catalogPath = new URL("../catalogo.js", import.meta.url);
let catalog = await readFile(catalogPath, "utf8");
const markerStart = "  // CAPTAIN_TSUBASA_COMPLETE_CATALOG";
const markerEnd = "  // CAPTAIN_TSUBASA_COMPLETE_CATALOG_END";
const entries = volumes.map(({ number, releaseDate, chapters }) => {
  const year = releaseDate.slice(0, 4);
  return `  { tipo: "hq", id: "captain-tsubasa-${number}-${year}", title: "Captain Tsubasa / Volume ${number}", shortTitle: "Captain Tsubasa / Volume ${number}", universe: "Captain Tsubasa", series: "Captain Tsubasa", href: "Mangás/Captain%20Tsubasa/captain-tsubasa-${number}-${year}.html", cover: "Mangás/Captain%20Tsubasa/Captain%20Tsubasa%20%23${number}.png", pageCount: 192, xpReward: 192, fileName: "captain-tsubasa-${number}-${year}.html", publicationDate: "${formatDate(releaseDate)}", chapters: "${chapters[0]} a ${chapters[1]}", keywords: ["Captain Tsubasa", "Volume ${number}", "Tsubasa Ozora", "Yōichi Takahashi", "Shueisha", "futebol"] },`;
}).join("\n");
const block = `${markerStart}\n${entries}\n${markerEnd}\n`;
const existing = new RegExp(`  // CAPTAIN_TSUBASA_COMPLETE_CATALOG[\\s\\S]*?  // CAPTAIN_TSUBASA_COMPLETE_CATALOG_END\\n`);
catalog = existing.test(catalog) ? catalog.replace(existing, block) : catalog.replace("  // HAJIME_NO_IPPO_COMPLETE_CATALOG", `${block}  // HAJIME_NO_IPPO_COMPLETE_CATALOG`);
await writeFile(catalogPath, catalog);

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>[^<]*Captain%20Tsubasa[^<]*<\/loc>\s*<\/url>/g, "");
const urls = [`  <url><loc>${baseUrl}/captain-tsubasa.html</loc></url>`, ...volumes.map(({ number, releaseDate }) => `  <url><loc>${baseUrl}/captain-tsubasa-${number}-${releaseDate.slice(0, 4)}.html</loc></url>`)].join("\n");
sitemap = sitemap.replace("</urlset>", `${urls}\n</urlset>`);
await writeFile(sitemapPath, sitemap);
console.log("Captain Tsubasa: 37 volumes, páginas, catálogo e sitemap preparados.");
