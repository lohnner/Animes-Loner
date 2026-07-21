import { firebaseConfig } from "./firebase-config.js";
import { catalogoVolumes } from "./catalogo.js";
import { GAME_CONFIG, brasiliaHourKey, freshHourlyBoxStock, upgradeCost } from "./game-config.js";
import { createClientGameService } from "./game-client-service.js";

const [appSdk, authSdk, dbSdk] = await Promise.all([
  import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
  import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
  import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
]);
const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
const auth = authSdk.getAuth(app), db = dbSdk.getFirestore(app);
const gate = document.querySelector("#storeGate"), storeApp = document.querySelector("#storeApp"), panels = document.querySelector("#storePanels"), notice = document.querySelector("#storeNotice"), dialog = document.querySelector("#storeDialog");
let user, shop, inventory = [], boxes = [], collectionItems = [], listings = [], publicShops = [], busy = false, activeTab = "boxes";
let gameService = null;
let renderedBoxHour = brasiliaHourKey();
const unsubscribers = [];

const esc = (value="") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const coverUrl = path => new URL(path, new URL("./", location.href)).href;
const condition = id => GAME_CONFIG.conditions[id] || { label: id, saleValue: 0 };
function message(text, type="success") { notice.textContent=text; notice.className=`store-notice ${type}`; notice.hidden=false; clearTimeout(message.timer); message.timer=setTimeout(()=>notice.hidden=true,6000); }
function errorMessage(error) {
  const code = String(error?.code || "");
  if (code.includes("functions/not-found")) return "O serviço da loja ainda não foi publicado no Firebase. Publique as Cloud Functions e tente novamente.";
  if (code.includes("functions/unauthenticated")) return "Sua sessão expirou. Entre novamente na conta.";
  if (code.includes("functions/unavailable") || code.includes("functions/internal")) return "O serviço da loja está temporariamente indisponível. Tente novamente.";
  return error?.message?.replace(/^FirebaseError:\s*/i, "") || "Falha de conexão. Tente novamente.";
}
async function action(name, data={}) { if (busy || !gameService?.[name]) return; busy=true; render(); try { const result=await gameService[name](data); if(result?.message) message(result.message); return result; } catch(e){ console.error(e); message(errorMessage(e),"error"); } finally { busy=false; render(); } }

function watchCollection(path, setter, queryBuilder) {
  const ref = dbSdk.collection(db, ...path); const target = queryBuilder ? queryBuilder(ref) : ref;
  unsubscribers.push(dbSdk.onSnapshot(target, snap => { setter(snap.docs.map(d=>({id:d.id,...d.data()}))); render(); }, e=>message(errorMessage(e),"error")));
}
function startWatchers() {
  unsubscribers.splice(0).forEach(fn=>fn());
  unsubscribers.push(dbSdk.onSnapshot(dbSdk.doc(db,"shops",user.uid), snap=>{shop=snap.exists()?snap.data():null; render();}));
  watchCollection(["shops",user.uid,"inventory"],v=>inventory=v);
  watchCollection(["shops",user.uid,"boxes"],v=>boxes=v,ref=>dbSdk.query(ref,dbSdk.orderBy("purchasedAt","desc")));
  watchCollection(["shops",user.uid,"collectionVolumes"],v=>collectionItems=v);
  watchCollection(["marketListings"],v=>listings=v,ref=>dbSdk.query(ref,dbSdk.where("status","==","active")));
  watchCollection(["shops"],v=>publicShops=v);
}

function itemCard(item, area="inventory") {
  const c=condition(item.condition); let actions="";
  if(area==="inventory") actions=`<button data-act="sellToNpc" data-id="${esc(item.copyId||item.id)}">Vender por ${c.saleValue} LM</button>${item.condition==="lacrado"?`<button data-act="list" data-id="${esc(item.copyId||item.id)}">Colocar à venda</button><button data-act="collect" data-id="${esc(item.copyId||item.id)}">Adicionar à coleção</button>`:""}<button class="danger" data-act="discard" data-id="${esc(item.copyId||item.id)}">Descartar</button>`;
  if(area==="listing") actions=item.sellerUid===user.uid?`<button data-act="cancelListing" data-id="${item.id}">Cancelar anúncio</button>`:`<button data-act="buyListing" data-id="${item.id}">Comprar por ${item.price} LM</button>`;
  return `<article class="item-card ${esc(item.condition)}"><img src="${coverUrl(item.cover)}" alt="Capa de ${esc(item.mangaTitle)} volume ${item.volumeNumber}" loading="lazy"><div class="item-body"><span class="condition condition-${esc(item.condition)}">${esc(c.label)}</span><h3>${esc(item.mangaTitle)}</h3><span>Volume ${item.volumeNumber}</span>${area==="inventory"||area==="reward"?`<strong class="sale-price">Valor de venda: ${c.saleValue} LM</strong>`:""}<div class="item-actions">${actions}</div></div></article>`;
}
function stats() { document.querySelector("#shopName").textContent=shop?.shopName||"Minha Loja"; document.querySelector("#storeStats").innerHTML=[[`Saldo`,`${shop?.lm??0} LM`],[`Inventário`,`${shop?.inventoryCount??0}/${shop?.inventoryCapacity??15}`],[`Prateleira`,`${shop?.marketListingCount??0}/${shop?.marketCapacity??5}`],[`Coleção`,`${shop?.collectionDistinctCount??0} pontos`]].map(([a,b])=>`<span class="stat-pill"><small>${a}</small><strong>${b}</strong></span>`).join(""); }
function boxesPanel(){ const descriptions={paid:"De 4 a 8 exemplares, com todas as condições possíveis.",premium:"De 4 a 8 exemplares e pelo menos um volume Lacrado garantido.",free:"Exatamente 2 exemplares, sem chance de Novo ou Lacrado."}; return `<section class="store-panel"><div class="panel-heading"><div><h2>Caixas</h2><p>O estoque é renovado a cada hora cheia no horário de Brasília.</p></div></div><div class="box-options">${Object.values(GAME_CONFIG.boxes).map(box=>`<article class="box-card"><div class="box-visual">📦</div><h3>${box.label}</h3><p>${descriptions[box.id]}</p><strong>${box.price?`${box.price} LM`:"GRÁTIS"}</strong><button data-act="buyBox" data-type="${box.id}" ${busy||shop.lm<box.price?"disabled":""}>Comprar caixa</button></article>`).join("")}</div><h2>Suas caixas</h2><div class="store-grid">${boxes.length?boxes.map(box=>`<article class="box-card"><div class="box-visual ${box.status==="opened"?"box-opening":""}">📦</div><h3>${esc(GAME_CONFIG.boxes[box.type]?.label||"Caixa")}</h3><p>${box.status==="purchased"?"Pronta para abrir":box.claimed?"Recompensas recebidas":`Recompensas pendentes: ${box.rewards?.length||0}`}</p>${box.status==="purchased"?`<button data-act="openBox" data-id="${box.id}">Abrir caixa</button>`:""}${box.status==="opened"&&!box.claimed?`<button data-act="claimBox" data-id="${box.id}">Receber recompensas</button>`:""}</article>`).join(""):"<p class='empty-state'>Nenhuma caixa comprada.</p>"}</div></section>`; }
function collectionPanel(){ const owned=new Map(collectionItems.map(x=>[x.volumeId,x])); const groups=Map.groupBy?Map.groupBy(catalogoVolumes,v=>v.mangaId):catalogoVolumes.reduce((m,v)=>(m.set(v.mangaId,[...(m.get(v.mangaId)||[]),v]),m),new Map()); return `<section class="store-panel"><h2>Coleção — ${shop.collectionDistinctCount||0} pontos</h2><p>Cada volume lacrado distinto vale um ponto; duplicatas são guardadas sem limite.</p><div class="store-grid">${[...groups].map(([id,vols])=>{const have=vols.filter(v=>owned.has(v.volumeId)).length,cover=vols.find(v=>v.volumeNumber===1)||vols[0];return `<article class="item-card collection-group" data-act="openCollection" data-id="${id}"><img class="collection-cover ${have?"":"locked"}" src="${coverUrl(cover.cover)}" alt="Capa de ${esc(cover.mangaTitle)}"><div class="item-body"><h3>${esc(cover.mangaTitle)}</h3><strong>${have} de ${vols.length} volumes distintos</strong></div></article>`}).join("")}</div></section>`; }
function renderPanel(){ if(!shop)return; const mine=listings.filter(x=>x.sellerUid===user.uid); const content={boxes:boxesPanel(),inventory:`<section class="store-panel"><h2>Inventário: ${inventory.length} / ${shop.inventoryCapacity}</h2><p>Venda qualquer exemplar diretamente pelo valor indicado em seu cartão.</p><div class="store-grid">${inventory.map(x=>itemCard(x)).join("")||"<p class='empty-state'>Seu inventário está vazio.</p>"}</div></section>`,market:`<section class="store-panel"><h2>Prateleira: ${mine.length} / ${shop.marketCapacity}</h2><div class="store-grid">${mine.map(x=>itemCard(x,"listing")).join("")||"<p class='empty-state'>Nenhum anúncio ativo.</p>"}</div></section>`,collection:collectionPanel(),shops:`<section class="store-panel"><h2>Visitar lojas</h2><input class="store-search" id="shopSearch" placeholder="Pesquisar pelo nome da loja"><div id="shopList">${shopRows("")}</div></section>`,upgrades:`<section class="store-panel"><h2>Melhorias</h2><div class="upgrade-list">${Object.entries(GAME_CONFIG.upgrades).map(([id,u])=>{const level=shop.upgradeLevels?.[id]||0,cost=upgradeCost(id,level);return `<article class="upgrade-card"><h3>${u.label}</h3><p>Nível ${level} · +${u.increase} espaços</p><button data-act="upgrade" data-type="${id}" ${shop.lm<cost?"disabled":""}>Melhorar por ${cost} LM</button></article>`}).join("")}</div></section>`}[activeTab]; panels.innerHTML=content; }
function shopRows(filter){return publicShops.filter(x=>x.ownerUid!==user.uid&&x.shopName?.toLowerCase().includes(filter.toLowerCase())).map(x=>`<div class="shop-row"><span><strong>${esc(x.shopName)}</strong><br><small>${esc(x.ownerDisplayName||"Leitor Loner")} · ${x.marketListingCount||0} anúncios</small></span><button data-act="visitShop" data-id="${x.ownerUid}">Visitar loja</button></div>`).join("")||"<p class='empty-state'>Nenhuma loja encontrada.</p>";}
function cleanupOpenedBoxes(){
  if(activeTab!=="boxes")return;
  panels.querySelectorAll(".box-opening").forEach(visual=>visual.closest(".box-card")?.remove());
  const pending=boxes.filter(box=>box.status==="opened"&&!box.claimed);
  if(!pending.length)return;
  panels.querySelector(".store-panel")?.insertAdjacentHTML("beforeend",`<section class="pending-rewards"><h2>Recompensas pendentes</h2><p>Libere espaço no inventário para receber estes resultados já sorteados.</p><div class="store-grid">${pending.map(box=>`<article class="box-card"><h3>${esc(GAME_CONFIG.boxes[box.type]?.label||"Caixa")}</h3><p>${box.rewards?.length||0} exemplares aguardando.</p><button data-act="claimBox" data-id="${box.id}">Receber recompensas</button></article>`).join("")}</div></section>`);
}
function renderHourlyBoxStock(){
  if(activeTab!=="boxes"||!shop)return;
  const currentHour=brasiliaHourKey(),stock=shop.boxStockHour===currentHour?{...freshHourlyBoxStock(),...shop.boxHourlyStock}:freshHourlyBoxStock();
  document.querySelectorAll('.box-options [data-act="buyBox"]').forEach(button=>{
    const box=GAME_CONFIG.boxes[button.dataset.type],remaining=stock[box.id]||0;
    button.closest(".box-card")?.querySelector(".box-hourly-stock")?.remove();
    button.insertAdjacentHTML("beforebegin",`<p class="box-hourly-stock"><strong>${remaining}</strong> de ${box.hourlyStock} disponível(is) nesta hora</p>`);
    if(remaining<1)button.disabled=true;
  });
  const heading=panels.querySelector(".panel-heading div");
  if(heading&&!heading.querySelector(".box-stock-reset"))heading.insertAdjacentHTML("beforeend",'<small class="box-stock-reset">O estoque é renovado na próxima hora de Brasília e não acumula.</small>');
}
function render(){
  queueMicrotask(renderHourlyBoxStock);
  if(!user){gate.innerHTML="<h1>Minha Loja</h1><p>Entre na sua conta pela barra lateral para jogar.</p>";gate.hidden=false;storeApp.hidden=true;return}
  if(!shop){gate.innerHTML=`<h1>Crie sua loja</h1><p>Escolha um nome entre 3 e 24 caracteres.</p><form id="createShopForm"><label for="newShopName">Nome da loja</label><input id="newShopName" minlength="3" maxlength="24" required><button class="button primary">Criar loja com 200 LM</button></form>`;gate.hidden=false;storeApp.hidden=true;return}
  gate.hidden=true;storeApp.hidden=false;stats();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===activeTab));renderPanel();cleanupOpenedBoxes();
}
function formatDuration(ms){const total=Math.ceil(ms/1000);return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`}
async function showRewards(rewards,title="Resultado da caixa"){
  const content=document.querySelector("#dialogContent"),reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches,token=crypto.randomUUID();
  showRewards.token=token;dialog.classList.remove("collection-dialog");dialog.classList.add("reward-dialog");
  content.innerHTML=`<section class="reward-opening-stage" aria-label="Abrindo caixa"><div class="reward-rays"></div><div class="reward-box" aria-hidden="true"><span class="reward-box-lid"></span><span class="reward-box-body">LM</span></div><h2>Abrindo sua caixa…</h2></section>`;
  if(!dialog.open)dialog.showModal();
  if(!reducedMotion)await new Promise(resolve=>setTimeout(resolve,1500));
  if(showRewards.token!==token||!dialog.open)return;
  content.innerHTML=`<header class="reward-result-heading"><p class="eyebrow">CAIXA ABERTA</p><h2>${title}</h2><p>Confira a condição e o valor de venda de cada exemplar.</p></header><div class="store-grid reward-grid">${rewards.map((x,i)=>itemCard(x,"reward").replace('class="item-card','style="--reward-delay:'+i*.14+'s" class="item-card reward-card')).join("")}</div>`;
}
async function handleClick(e){
  const el=e.target.closest("[data-act]");if(!el)return;
  const {act,id,type}=el.dataset;
  if(act==="buyBox")await action("buyBox",{type});
  if(act==="openBox"){const result=await action("openBox",{boxId:id});if(result?.rewards)showRewards(result.rewards)}
  if(act==="claimBox")await action("claimBox",{boxId:id});
  if(act==="sellToNpc"&&confirm("Vender este exemplar pelo valor indicado?"))await action("sellToNpc",{copyId:id});
  if(act==="discard"&&confirm("Descartar definitivamente este exemplar?"))await action("discardItem",{copyId:id});
  if(act==="collect")await action("moveToCollection",{copyId:id});
  if(act==="list"){
    const price=Number(prompt(`Preço inteiro em LM (máximo ${GAME_CONFIG.currency.maxSafePrice}):`));
    if(Number.isSafeInteger(price)&&price>0&&price<=GAME_CONFIG.currency.maxSafePrice)await action("createListing",{copyId:id,price});else message("Informe um preço inteiro válido.","error");
  }
  if(act==="cancelListing")await action("cancelListing",{listingId:id});
  if(act==="buyListing")await action("buyListing",{listingId:id});
  if(act==="upgrade")await action("buyUpgrade",{type});
  if(act==="visitShop"){
    const items=listings.filter(x=>x.sellerUid===id);
    document.querySelector("#dialogContent").innerHTML=`<h2>${esc(publicShops.find(x=>x.ownerUid===id)?.shopName||"Loja")}</h2><div class="store-grid">${items.map(x=>itemCard(x,"listing")).join("")||"<p>Esta loja não tem anúncios.</p>"}</div>`;dialog.showModal();
  }
  if(act==="openCollection"){
    const vols=catalogoVolumes.filter(v=>v.mangaId===id).sort((a,b)=>a.volumeNumber-b.volumeNumber),owned=new Map(collectionItems.map(x=>[x.volumeId,x]));
    document.querySelector("#dialogContent").innerHTML=`<h2>${esc(vols[0]?.mangaTitle)}</h2><div class="store-grid">${vols.map(v=>{const o=owned.get(v.volumeId);return `<article class="item-card"><img class="collection-cover ${o?"":"locked"}" src="${coverUrl(v.cover)}" alt="Capa volume ${v.volumeNumber}"><div class="item-body"><h3>Volume ${v.volumeNumber}</h3><strong>Possuídos: ${o?.quantity||0}</strong>${o?`<button data-act="removeCollection" data-id="${v.volumeId}">Retirar uma cópia</button>`:""}</div></article>`}).join("")}</div>`;dialog.showModal();
  }
  if(act==="removeCollection")await action("removeFromCollection",{volumeId:id});
}
document.addEventListener("click",handleClick);document.querySelector("[data-close-dialog]").onclick=()=>dialog.close();document.querySelector(".store-tabs").onclick=e=>{const b=e.target.closest("[data-tab]");if(b){activeTab=b.dataset.tab;render()}};document.addEventListener("input",e=>{if(e.target.id==="shopSearch")document.querySelector("#shopList").innerHTML=shopRows(e.target.value)});document.addEventListener("submit",async e=>{if(e.target.id!=="createShopForm")return;e.preventDefault();const shopName=document.querySelector("#newShopName").value.trim();if(shopName.length<3||shopName.length>24)return message("O nome deve ter entre 3 e 24 caracteres.","error");await action("createShop",{shopName})});
setInterval(()=>{const currentHour=brasiliaHourKey();if(currentHour!==renderedBoxHour){renderedBoxHour=currentHour;render()}},1000);
document.addEventListener("click",event=>{const action=event.target.closest("[data-act]")?.dataset.act;if(action){dialog.classList.toggle("collection-dialog",action==="openCollection");if(action!=="openBox")dialog.classList.remove("reward-dialog")}});
document.querySelectorAll("[data-close-dialog]").forEach(button=>{button.onclick=null;button.addEventListener("click",()=>{showRewards.token=null;dialog.classList.remove("reward-dialog");dialog.close()})});
authSdk.onAuthStateChanged(auth,current=>{user=current;if(!user){gameService=null;render();return}gameService=createClientGameService({db,sdk:dbSdk,user,catalog:catalogoVolumes});startWatchers();render()});
