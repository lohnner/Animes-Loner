import { readFile, writeFile } from "node:fs/promises";

const output = new URL("../Mangás/Berserk/", import.meta.url);
const years = [1990,1991,1991,1992,1993,1993,1994,1994,1995,1995,1996,1996,1997,1997,1998,1998,1999,1999,2000,2000,2001,2001,2002,2002,2003,2003,2004,2005,2005,2006,2006,2007,2008,2009,2010,2011,2013,2016,2017,2018,2021,2023,2025];
const chapterRanges = [
  "-16 a -14", "-13 a -12", "-11 a -8", "-7 a -3", "-2 a 6",
  "7 a 16", "17 a 26", "27 a 36", "37 a 47", "48 a 58", "59 a 69", "70 a 79", "80 a 91", "92 a 99",
  "100 a 110", "111 a 121", "122 a 132", "133 a 143", "144 a 154", "155 a 165", "166 a 176", "177 a 186",
  "187 a 196", "197 a 206", "207 a 216", "217 a 226", "227 a 236", "237 a 246", "247 a 256", "257 a 266",
  "267 a 276", "277 a 286", "287 a 296", "297 a 306", "307 a 315", "316 a 324", "325 a 333", "334 a 342",
  "343 a 350", "351 a 357", "358 a 364", "365 a 373", "374 a 382"
];
const volumes = years.map((year, index) => ({ number: index + 1, year, chapters: chapterRanges[index] }));

const arcText = (number) => {
  if (number <= 3) return "a jornada brutal de Guts como o Espadachim Negro e sua perseguição aos Apóstolos";
  if (number <= 14) return "a Era de Ouro, o passado de Guts e sua relação com Griffith, Casca e o Bando do Falcão";
  if (number <= 21) return "as consequências do Eclipse e os acontecimentos sombrios do arco da Condenação";
  if (number <= 35) return "a guerra que transforma Midland durante o arco do Falcão do Império Milenar";
  return "a longa travessia de Guts e seus companheiros no arco Fantasia e os novos rumos do confronto com Griffith";
};

const shellStart = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><meta name="twitter:card" content="summary_large_image"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const shellEnd = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;
const baseUrl = "https://lohnner.github.io/Animes-Loner/Mang%C3%A1s/Berserk";

for (const { number, year, chapters } of volumes.slice(1)) {
  const title = `Berserk / Volume ${number}`;
  const description = `Volume ${number} de Berserk, publicado pela Hakusensha em ${year}.`;
  const file = `berserk-${number}-${year}.html`;
  const cover = `Berserk%20%23${number}.png`;
  const creator = number <= 41 ? "Kentaro Miura" : "Kentaro Miura / Studio Gaga";
  const supervision = number <= 41 ? "Kentaro Miura" : "Kouji Mori";
  const page = `${shellStart(title, description, `${baseUrl}/${file}`, `${baseUrl}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="berserk.html">Berserk</a><span>/</span><span>Volume ${number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume acompanha ${arcText(number)}.</p><p>A narrativa combina fantasia sombria, horror e drama em uma história marcada pela luta de Guts contra o destino e pelas consequências das escolhas de Griffith.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>Berserk #${number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Editora</th><td>Hakusensha</td></tr><tr><th>Criação</th><td>${creator}</td></tr><tr><th>Supervisão</th><td>${supervision}</td></tr><tr><th>Série</th><td><a href="berserk.html">Berserk</a></td></tr><tr><th>Capítulos</th><td>${chapters}</td></tr><tr><th>Formato</th><td>Tankōbon</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${number} de Berserk"/><table><tbody><tr><th>Universo</th><td>Berserk</td></tr><tr><th>Série</th><td>Berserk</td></tr><tr><th>Editora</th><td>Hakusensha</td></tr><tr><th>Ano</th><td>${year}</td></tr></tbody></table></aside></main>${shellEnd}`;
  await writeFile(new URL(file, output), page);
}

const catalogPath = new URL("../catalogo.js", import.meta.url);
let catalog = await readFile(catalogPath, "utf8");
const marker = "  // BERSERK_COMPLETE_CATALOG\n";
if (!catalog.includes(marker)) {
  const entries = marker + volumes.slice(1).map(({ number, year }) => `  { tipo: "hq", id: "berserk-${number}-${year}", title: "Berserk / Volume ${number}", shortTitle: "Berserk / Volume ${number}", universe: "Berserk", series: "Berserk", href: "Mangás/Berserk/berserk-${number}-${year}.html", cover: "Mangás/Berserk/Berserk%20%23${number}.png", pageCount: 224, xpReward: 224, fileName: "berserk-${number}-${year}.html", keywords: ["Berserk", "Volume ${number}", "Guts", "Griffith", "Kentaro Miura", "Studio Gaga", "Hakusensha", "fantasia sombria"] },`).join("\n") + "\n";
  catalog = catalog.replace("  // YU_YU_HAKUSHO_CATALOG", `${entries}  // YU_YU_HAKUSHO_CATALOG`);
  await writeFile(catalogPath, catalog);
}

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
const missingUrls = volumes.slice(1).filter(({ number, year }) => !sitemap.includes(`Berserk/berserk-${number}-${year}.html`)).map(({ number, year }) => `  <url><loc>${baseUrl}/berserk-${number}-${year}.html</loc></url>`);
if (missingUrls.length) {
  sitemap = sitemap.replace("</urlset>", `${missingUrls.join("\n")}\n</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

console.log("Berserk: 43 volumes, catálogo e sitemap preparados.");
