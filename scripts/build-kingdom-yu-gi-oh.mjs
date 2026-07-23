import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const date = iso => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
const shell = (title, description, canonical, image) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} - Loner Mangá</title><link rel="icon" href="../../favicon.png"/><meta name="theme-color" content="#0a0d14"/><meta name="description" content="${description}"/><link rel="canonical" href="${canonical}"/><meta property="og:type" content="article"/><meta property="og:site_name" content="Loner Mangá"/><meta property="og:title" content="${title} - Loner Mangá"/><meta property="og:description" content="${description}"/><meta property="og:image" content="${image}"/><meta property="og:url" content="${canonical}"/><link rel="stylesheet" href="../../styles.css" data-loner-cache-bust/><script src="../../boot.js" data-loner-app="../../script.js"></script></head><body><div class="site-shell"><aside class="sidebar"><a class="brand sidebar-fallback-brand" href="../../index.html"><span class="brand-mark">LM</span><span><strong>Loner Mangá</strong><small>Arquivo de mangás</small></span></a><nav class="wiki-nav sidebar-fallback-nav"><a href="../../index.html">HOME</a><a href="../../Universos/universos.html">Mangás</a><a href="../../pesquisar.html">Pesquisar</a><a href="../../ranking.html">Ranking de Usuários</a></nav></aside><div class="content-shell"><header class="topbar"></header>`;
const end = `<footer class="site-footer"><p>Loner Mangá é um projeto local de catalogação de mangás.</p></footer></div></div></body></html>\n`;

const series = [
  {
    key: "KINGDOM", folder: "Kingdom", slug: "kingdom", title: "Kingdom", author: "Yasuhisa Hara", years: "2006 – presente", data: "kingdom-volumes.json",
    description: "Mangá histórico de Yasuhisa Hara sobre Shin e Ei Sei durante a unificação da China.",
    summary: "Na China do período dos Estados Combatentes, o jovem Shin sonha em se tornar o maior general sob os céus. Ao lado do rei Ei Sei, ele atravessa rebeliões, campanhas militares e disputas políticas na busca pela unificação.",
    keywords: "Shin, Ei Sei, China, Estados Combatentes",
    stage: chapter => chapter <= 173 ? "a ascensão de Shin e as primeiras guerras de Qin" : chapter <= 356 ? "as grandes campanhas que culminam na invasão da Coalizão" : chapter <= 495 ? "as disputas internas de Qin e novas campanhas militares" : chapter <= 700 ? "a invasão de Zhao e as batalhas decisivas pela unificação" : "as campanhas recentes de Qin contra Zhao e Han"
  },
  {
    key: "YU_GI_OH", folder: "Yu-Gi-Oh!", slug: "yu-gi-oh", title: "Yu-Gi-Oh!", author: "Kazuki Takahashi", years: "1996 – 2004", data: "yu-gi-oh-volumes.json",
    description: "Mangá completo de Kazuki Takahashi sobre Yugi Muto, o Enigma do Milênio e os Jogos das Sombras.",
    summary: "Após montar o Enigma do Milênio, Yugi Muto desperta uma personalidade misteriosa que enfrenta adversários em jogos perigosos. A jornada evolui para grandes torneios de Duel Monsters e uma busca pelas memórias do faraó Atem.",
    keywords: "Yugi Muto, Atem, Kaiba, Duel Monsters",
    stage: chapter => chapter <= 49 ? "os primeiros Jogos das Sombras e o confronto com Kaiba" : chapter <= 59 ? "o RPG Monster World contra Bakura" : chapter <= 133 ? "o Reino dos Duelistas" : chapter <= 278 ? "a Cidade das Batalhas" : "o Mundo das Memórias e a batalha final pelo destino do faraó"
  }
];

let catalog = await readFile(new URL("catalogo.js", root), "utf8");
let sitemap = await readFile(new URL("sitemap.xml", root), "utf8");
for (const item of series) {
  const volumes = JSON.parse(await readFile(new URL(item.data, import.meta.url), "utf8"));
  const output = new URL(`Mangás/${item.folder}/`, root);
  await mkdir(output, { recursive: true });
  const encodedFolder = encodeURIComponent(item.folder).replace(/%2F/g, "/");
  const base = `https://lohnner.github.io/Animes-Loner/Mang%C3%A1s/${encodedFolder}`;
  const encodedTitle = encodeURIComponent(item.title);
  const cards = volumes.map(v => `<a class="volume-card" href="${item.slug}-${v.number}-${v.releaseDate.slice(0, 4)}.html"><img src="${encodedTitle}%20%23${v.number}.png" alt="Capa do volume ${v.number} de ${item.title}" loading="lazy"/><span>Volume ${v.number}</span></a>`).join("");
  const lastChapter = volumes.at(-1).chapters[1];
  const main = `${shell(item.title, item.description, `${base}/${item.slug}.html`, `${base}/${encodedTitle}%20%231.png`)}<main class="wiki-page universe-layout"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><span>${item.title}</span></nav><header class="article-header"><h1>${item.title}</h1><p class="lead">${item.description}</p></header><section class="content-band"><h2>Resumo do Mangá</h2><p>${item.summary}</p></section><section class="content-band"><h2>Informações do Mangá</h2><table class="data-table"><tbody><tr><th>Autor</th><td>${item.author}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>${item.years}</td></tr><tr><th>Volumes</th><td>${volumes.length}</td></tr><tr><th>Capítulos</th><td>1 a ${lastChapter}</td></tr></tbody></table></section><section class="content-band"><h2>Volumes</h2><div class="volume-gallery">${cards}</div></section></article></main>${end}`;
  await writeFile(new URL(`${item.slug}.html`, output), main);

  for (const v of volumes) {
    const year = v.releaseDate.slice(0, 4), [first, last] = v.chapters;
    const file = `${item.slug}-${v.number}-${year}.html`, cover = `${encodedTitle}%20%23${v.number}.png`, title = `${item.title} / Volume ${v.number}`;
    const description = `Volume ${v.number} de ${item.title}, de ${item.author}, reunindo os capítulos ${first} a ${last}.`;
    const page = `${shell(title, description, `${base}/${file}`, `${base}/${cover}`)}<main class="wiki-page"><article class="article"><nav class="breadcrumbs"><a href="../../index.html">Início</a><span>/</span><a href="../../Universos/universos.html">Mangás</a><span>/</span><a href="${item.slug}.html">${item.title}</a><span>/</span><span>Volume ${v.number}</span></nav><header class="article-header"><h1>${title}</h1><p class="lead">${description}</p></header><section class="content-band"><h2>Resumo</h2><p>Este volume acompanha ${item.stage(first)}.</p><p>A narrativa avança pelos acontecimentos reunidos nos capítulos ${first} a ${last}.</p></section><section class="content-band"><h2>Dados do Volume</h2><table class="data-table"><tbody><tr><th>Título</th><td>${item.title} #${v.number}</td></tr><tr><th>Ano</th><td>${year}</td></tr><tr><th>Publicação</th><td>${date(v.releaseDate)}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Roteiro e arte</th><td>${item.author}</td></tr><tr><th>Série</th><td><a href="${item.slug}.html">${item.title}</a></td></tr><tr><th>Capítulos</th><td>${first} a ${last}</td></tr><tr><th>Páginas</th><td>${v.pageCount} páginas</td></tr></tbody></table></section></article><aside class="infobox"><h2>${title}</h2><img src="${cover}" alt="Capa do volume ${v.number} de ${item.title}"/><table><tbody><tr><th>Universo</th><td>${item.title}</td></tr><tr><th>Editora</th><td>Shueisha</td></tr><tr><th>Publicação</th><td>${date(v.releaseDate)}</td></tr><tr><th>Capítulos</th><td>${first} a ${last}</td></tr></tbody></table></aside></main>${end}`;
    await writeFile(new URL(file, output), page);
  }

  const marker = new RegExp(`  // ${item.key}_COMPLETE_CATALOG[\\s\\S]*?  // ${item.key}_COMPLETE_CATALOG_END\\n`);
  catalog = catalog.replace(marker, "");
  const legacyIds = item.slug === "kingdom" ? ["kingdom-1-2006"] : ["yu-gi-oh-1-1997", "yu-gi-oh-2-1997", "yu-gi-oh-3-1997"];
  for (const id of legacyIds) catalog = catalog.replace(new RegExp(`\\n  \\{\\n    tipo: "hq",\\n    id: "${id}",[\\s\\S]*?\\n  \\},`), "");
  const entries = volumes.map(v => { const year = v.releaseDate.slice(0, 4); return `  { tipo: "hq", id: "${item.slug}-${v.number}-${year}", title: "${item.title} / Volume ${v.number}", shortTitle: "${item.title} / Volume ${v.number}", universe: "${item.title}", series: "${item.title}", href: "Mangás/${encodedFolder}/${item.slug}-${v.number}-${year}.html", cover: "Mangás/${encodedFolder}/${encodedTitle}%20%23${v.number}.png", pageCount: ${v.pageCount}, xpReward: ${v.pageCount}, fileName: "${item.slug}-${v.number}-${year}.html", publicationDate: "${date(v.releaseDate)}", chapters: "${v.chapters[0]} a ${v.chapters[1]}", keywords: ["${item.title}", "Volume ${v.number}", "${item.author}", "Shueisha", "${item.keywords}"] },`; }).join("\n");
  const block = `  // ${item.key}_COMPLETE_CATALOG\n${entries}\n  // ${item.key}_COMPLETE_CATALOG_END\n`;
  catalog = catalog.replace("  // DRAGON_BALL_COMPLETE_CATALOG", `${block}  // DRAGON_BALL_COMPLETE_CATALOG`);
  sitemap = sitemap.replace(new RegExp(`\\s*<url>\\s*<loc>[^<]*Mang%C3%A1s/${encodedFolder.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}[^<]*<\\/loc>\\s*<\\/url>`, "g"), "");
  const urls = [`${base}/${item.slug}.html`, ...volumes.map(v => `${base}/${item.slug}-${v.number}-${v.releaseDate.slice(0, 4)}.html`)].map(url => `  <url><loc>${url}</loc></url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${urls}\n</urlset>`);
  console.log(`${item.title}: ${volumes.length} volumes e capítulos 1 a ${lastChapter}.`);
}
await writeFile(new URL("catalogo.js", root), catalog);
await writeFile(new URL("sitemap.xml", root), sitemap);
