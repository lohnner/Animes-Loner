import { mkdir, readFile, writeFile } from "node:fs/promises";

const output = new URL("../Mangás/Hajime no Ippo/", import.meta.url);
const volumes = JSON.parse(await readFile(new URL("hajime-no-ippo-volumes.json", import.meta.url), "utf8"));
const baseUrl = "https://lohnner.github.io/Animes-Loner/Mang%C3%A1s/Hajime%20no%20Ippo";
await mkdir(output, { recursive: true });

const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
};

const storyText = (chapter) => {
  if (chapter <= 269) return "os primeiros passos de Ippo Makunouchi no boxe, suas lutas de estreia e a busca pelo título japonês dos penas";
  if (chapter <= 414) return "a defesa do cinturão de Ippo e os desafios que consolidam sua posição entre os melhores boxeadores do Japão";
  if (chapter <= 558) return "a preparação para confrontos internacionais e a evolução dos companheiros do Ginásio Kamogawa";
  if (chapter <= 849) return "a trajetória de Ippo pelo cenário do boxe asiático e as lutas decisivas de seus grandes rivais";
  if (chapter <= 1209) return "os desafios que levam Ippo a reconsiderar sua carreira e a compreender mais profundamente o significado de ser forte";
  return "a nova fase de Ippo junto ao Ginásio Kamogawa, acompanhando seus discípulos, amigos e rivais no cenário mundial";
};

const shellStart = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><meta name="twitter:card" content="summary_large_image"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const shellEnd = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;

const volumeCards = volumes.map(({ number, releaseDate }) =>
  `<a class="volume-card" href="hajime-no-ippo-${number}-${releaseDate.slice(0, 4)}.html"><img src="Hajime%20no%20Ippo%20%23${number}.png" alt="Capa do volume ${number} de Hajime no Ippo" loading="lazy"/><span>Volume ${number}</span></a>`
).join("");

const seriesDescription = "Mangá de boxe criado por George Morikawa sobre a jornada de Ippo Makunouchi, do jovem tímido ao pugilista profissional.";
const seriesPage = `${shellStart("Hajime no Ippo", seriesDescription, `${baseUrl}/hajime-no-ippo.html`, `${baseUrl}/Hajime%20no%20Ippo%20%231.png`)}<main class="wiki-page universe-layout"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><span>Hajime no Ippo</span></nav><header class="article-header"><h1>Hajime no Ippo</h1><p class="lead">Mangá esportivo de George Morikawa que acompanha Ippo Makunouchi em sua descoberta do boxe e na busca pela resposta à pergunta: o que significa ser forte?</p></header><section class="content-band"><h2>Resumo do Mangá</h2><p>Ippo é um estudante tímido que ajuda a mãe no negócio de pesca da família e sofre constantes agressões de colegas. Depois de ser salvo pelo boxeador Mamoru Takamura, ele conhece o Ginásio Kamogawa e descobre um talento extraordinário para o boxe.</p><p>Orientado por Genji Kamogawa e cercado por companheiros como Takamura, Aoki e Kimura, Ippo enfrenta adversários memoráveis, desenvolve seu estilo de luta e amadurece dentro e fora do ringue.</p></section><section class="content-band"><h2>Informações do Mangá</h2><table class="data-table"><tbody><tr><th>Autor</th><td>George Morikawa</td></tr><tr><th>Editora</th><td>Kodansha</td></tr><tr><th>Revista</th><td>Weekly Shōnen Magazine</td></tr><tr><th>Publicação</th><td>1989 – presente</td></tr><tr><th>Volumes</th><td>${volumes.length}</td></tr><tr><th>Capítulos compilados</th><td>1 a ${volumes.at(-1).chapters[1]}</td></tr></tbody></table></section><section class="content-band"><h2>Volumes</h2><div class="volume-gallery">${volumeCards}</div></section></article></main>${shellEnd}`;
await writeFile(new URL("hajime-no-ippo.html", output), seriesPage);

for (const { number, releaseDate, chapters } of volumes) {
  const year = releaseDate.slice(0, 4);
  const [startChapter, endChapter] = chapters;
  const title = `Hajime no Ippo / Volume ${number}`;
  const description = `Volume ${number} de Hajime no Ippo, de George Morikawa, reunindo os capítulos ${startChapter} a ${endChapter}.`;
  const file = `hajime-no-ippo-${number}-${year}.html`;
  const cover = `Hajime%20no%20Ippo%20%23${number}.png`;
  const page = `${shellStart(title, description, `${baseUrl}/${file}`, `${baseUrl}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="hajime-no-ippo.html">Hajime no Ippo</a><span>/</span><span>Volume ${number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume acompanha ${storyText(startChapter)}.</p><p>A narrativa combina combates técnicos, treinamento, rivalidade e crescimento pessoal, aprofundando o universo do boxe criado por George Morikawa.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>Hajime no Ippo #${number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr><tr><th>Editora</th><td>Kodansha</td></tr><tr><th>Roteiro e arte</th><td>George Morikawa</td></tr><tr><th>Série</th><td><a href="hajime-no-ippo.html">Hajime no Ippo</a></td></tr><tr><th>Capítulos</th><td>${startChapter} a ${endChapter}</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${number} de Hajime no Ippo"/><table><tbody><tr><th>Universo</th><td>Hajime no Ippo</td></tr><tr><th>Editora</th><td>Kodansha</td></tr><tr><th>Publicação</th><td>${formatDate(releaseDate)}</td></tr><tr><th>Capítulos</th><td>${startChapter} a ${endChapter}</td></tr></tbody></table></aside></main>${shellEnd}`;
  await writeFile(new URL(file, output), page);
}

const catalogPath = new URL("../catalogo.js", import.meta.url);
let catalog = await readFile(catalogPath, "utf8");
const markerStart = "  // HAJIME_NO_IPPO_COMPLETE_CATALOG";
const markerEnd = "  // HAJIME_NO_IPPO_COMPLETE_CATALOG_END";
const entries = volumes.map(({ number, releaseDate, chapters }) => {
  const year = releaseDate.slice(0, 4);
  return `  { tipo: "hq", id: "hajime-no-ippo-${number}-${year}", title: "Hajime no Ippo / Volume ${number}", shortTitle: "Hajime no Ippo / Volume ${number}", universe: "Hajime no Ippo", series: "Hajime no Ippo", href: "Mangás/Hajime%20no%20Ippo/hajime-no-ippo-${number}-${year}.html", cover: "Mangás/Hajime%20no%20Ippo/Hajime%20no%20Ippo%20%23${number}.png", pageCount: 200, xpReward: 200, fileName: "hajime-no-ippo-${number}-${year}.html", publicationDate: "${formatDate(releaseDate)}", chapters: "${chapters[0]} a ${chapters[1]}", keywords: ["Hajime no Ippo", "Volume ${number}", "Ippo Makunouchi", "George Morikawa", "Kodansha", "boxe"] },`;
}).join("\n");
const block = `${markerStart}\n${entries}\n${markerEnd}\n`;
const existing = new RegExp(`  // HAJIME_NO_IPPO_COMPLETE_CATALOG[\\s\\S]*?  // HAJIME_NO_IPPO_COMPLETE_CATALOG_END\\n`);
catalog = existing.test(catalog) ? catalog.replace(existing, block) : catalog.replace("  // ONE_PIECE_COMPLETE_CATALOG", `${block}  // ONE_PIECE_COMPLETE_CATALOG`);
await writeFile(catalogPath, catalog);

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>[^<]*Hajime%20no%20Ippo[^<]*<\/loc>\s*<\/url>/g, "");
const urls = [`  <url><loc>${baseUrl}/hajime-no-ippo.html</loc></url>`, ...volumes.map(({ number, releaseDate }) => `  <url><loc>${baseUrl}/hajime-no-ippo-${number}-${releaseDate.slice(0, 4)}.html</loc></url>`)].join("\n");
sitemap = sitemap.replace("</urlset>", `${urls}\n</urlset>`);
await writeFile(sitemapPath, sitemap);

console.log(`Hajime no Ippo: ${volumes.length} volumes, páginas, catálogo e sitemap preparados.`);
