import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const output = new URL("../Mangás/Yu Yu Hakusho/", import.meta.url);
const volumes = [
  [1, 1991, "1 a 8"], [2, 1991, "9 a 17"], [3, 1991, "18 a 26"], [4, 1991, "27 a 35"],
  [5, 1992, "36 a 44"], [6, 1992, "45 a 53"], [7, 1992, "54 a 63"], [8, 1992, "64 a 72"],
  [9, 1992, "73 a 81"], [10, 1993, "82 a 90"], [11, 1993, "91 a 99"], [12, 1993, "100 a 108"],
  [13, 1993, "109 a 117"], [14, 1993, "118 a 126"], [15, 1994, "127 a 135"], [16, 1994, "136 a 144"],
  [17, 1994, "145 a 153"], [18, 1994, "154 a 163"], [19, 1994, "164 a 175"]
];

const arcText = (number) => {
  if (number <= 2) return "os primeiros casos de Yusuke como Detetive Espiritual e sua nova ligação com o Mundo Espiritual";
  if (number <= 5) return "o amadurecimento da equipe de Yusuke durante missões cada vez mais perigosas no Mundo dos Homens";
  if (number <= 13) return "os confrontos decisivos do Torneio das Trevas, que colocam Yusuke e seus companheiros diante de adversários poderosos";
  if (number <= 17) return "a crise envolvendo o portal para o Mundo das Trevas e os novos limites dos poderes de Yusuke";
  return "a jornada final no Mundo das Trevas e o encerramento da história de Yusuke, Kuwabara, Kurama e Hiei";
};

const shellStart = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><meta name="twitter:card" content="summary_large_image"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const shellEnd = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;

await mkdir(output, { recursive: true });
const baseUrl = "https://lohnner.github.io/Loner-Manga/Mang%C3%A1s/Yu%20Yu%20Hakusho";
const seriesDescription = "Mangá sobrenatural de Yoshihiro Togashi que acompanha Yusuke Urameshi em sua jornada como Detetive Espiritual.";
const seriesPage = `${shellStart("Yu Yu Hakusho", seriesDescription, `${baseUrl}/yu-yu-hakusho.html`, `${baseUrl}/Yu%20Yu%20Hakusho%20%231.png`)}<main class="wiki-page universe-layout"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><span>Yu Yu Hakusho</span></nav><header class="article-header"><h1>Yu Yu Hakusho</h1><p class="lead">Mangá sobrenatural criado por Yoshihiro Togashi sobre um jovem delinquente que recebe uma segunda chance como Detetive Espiritual.</p></header><section class="content-band"><h2>Resumo do Mangá</h2><p>Yusuke Urameshi morre ao salvar uma criança e surpreende o Mundo Espiritual com seu gesto altruísta. Depois de retornar à vida, ele passa a investigar casos sobrenaturais sob as ordens de Koenma.</p><p>Ao lado de Kazuma Kuwabara, Kurama e Hiei, Yusuke enfrenta demônios, torneios e ameaças capazes de romper o equilíbrio entre os mundos dos humanos e dos espíritos.</p></section><section class="content-band"><h2>Informações do Mangá</h2><table class="data-table"><tbody><tr><th>Autor</th><td>Yoshihiro Togashi</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>1990 – 1994</td></tr><tr><th>Volumes</th><td>19</td></tr><tr><th>Capítulos</th><td>175</td></tr></tbody></table></section><section class="content-band"><h2>Volumes</h2><div class="volume-gallery"><a class="volume-card" href="yu-yu-hakusho-1-1991.html"><img src="Yu%20Yu%20Hakusho%20%231.png" alt="Capa do volume 1 de Yu Yu Hakusho"/><span>Volume 1</span></a></div></section></article></main>${shellEnd}`;
await writeFile(new URL("yu-yu-hakusho.html", output), seriesPage);

for (const [number, year, chapters] of volumes) {
  const title = `Yu Yu Hakusho / Volume ${number}`;
  const description = `Volume ${number} de Yu Yu Hakusho, de Yoshihiro Togashi, reunindo os capítulos ${chapters}.`;
  const file = `yu-yu-hakusho-${number}-${year}.html`;
  const cover = `Yu%20Yu%20Hakusho%20%23${number}.png`;
  const page = `${shellStart(title, description, `${baseUrl}/${file}`, `${baseUrl}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="yu-yu-hakusho.html">Yu Yu Hakusho</a><span>/</span><span>Volume ${number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume acompanha ${arcText(number)}.</p><p>A narrativa combina ação, humor e drama enquanto aprofunda os vínculos entre os protagonistas e amplia o universo sobrenatural criado por Yoshihiro Togashi.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>Yu Yu Hakusho #${number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Roteiro</th><td>Yoshihiro Togashi</td></tr><tr><th>Arte</th><td>Yoshihiro Togashi</td></tr><tr><th>Série</th><td><a href="yu-yu-hakusho.html">Yu Yu Hakusho</a></td></tr><tr><th>Capítulos</th><td>${chapters}</td></tr><tr><th>Páginas</th><td>Formato tankōbon</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${number} de Yu Yu Hakusho"/><table><tbody><tr><th>Universo</th><td>Yu Yu Hakusho</td></tr><tr><th>Série</th><td>Yu Yu Hakusho</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Ano</th><td>${year}</td></tr></tbody></table></aside></main>${shellEnd}`;
  await writeFile(new URL(file, output), page);
}

const catalogPath = new URL("../catalogo.js", import.meta.url);
let catalog = await readFile(catalogPath, "utf8");
const marker = "  // YU_YU_HAKUSHO_CATALOG\n";
if (!catalog.includes(marker)) {
  const entries = [
    `  // YU_YU_HAKUSHO_CATALOG`,
    `  { tipo: "universo", id: "yu-yu-hakusho", title: "Yu Yu Hakusho", href: "Mangás/Yu%20Yu%20Hakusho/yu-yu-hakusho.html" },`,
    `  { tipo: "serie", id: "yu-yu-hakusho-1990", title: "Yu Yu Hakusho", year: "1990", universe: "Yu Yu Hakusho", href: "Mangás/Yu%20Yu%20Hakusho/yu-yu-hakusho.html" },`,
    ...volumes.map(([number, year, chapters]) => `  { tipo: "hq", id: "yu-yu-hakusho-${number}-${year}", title: "Yu Yu Hakusho / Volume ${number}", shortTitle: "Yu Yu Hakusho / Volume ${number}", universe: "Yu Yu Hakusho", series: "Yu Yu Hakusho", href: "Mangás/Yu%20Yu%20Hakusho/yu-yu-hakusho-${number}-${year}.html", cover: "Mangás/Yu%20Yu%20Hakusho/Yu%20Yu%20Hakusho%20%23${number}.png", pageCount: 192, xpReward: 192, fileName: "yu-yu-hakusho-${number}-${year}.html", chapters: "${chapters}", keywords: ["Yu Yu Hakusho", "Volume ${number}", "Yusuke Urameshi", "Yoshihiro Togashi", "Shueisha"] },`)
  ].join("\n") + "\n";
  catalog = catalog.replace("\n];\n\nconst hqsCatalogadas", `,\n${entries}];\n\nconst hqsCatalogadas`);
  await writeFile(catalogPath, catalog);
}

const sitemapPath = new URL("../sitemap.xml", import.meta.url);
let sitemap = await readFile(sitemapPath, "utf8");
if (!sitemap.includes("Yu%20Yu%20Hakusho/yu-yu-hakusho.html")) {
  const urls = [
    `  <url><loc>${baseUrl}/yu-yu-hakusho.html</loc></url>`,
    ...volumes.map(([number, year]) => `  <url><loc>${baseUrl}/yu-yu-hakusho-${number}-${year}.html</loc></url>`)
  ].join("\n");
  sitemap = sitemap.replace("</urlset>", `${urls}\n</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

console.log("Yu Yu Hakusho: página principal, 19 volumes e catálogo gerados.");
