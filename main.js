// ==== STATE, CONFIG & ROUTING ====
const routes = {
  main: renderMain,
  species: renderSpecies,
  upgrades: renderUpgrades,
  shop: renderShop,
  about: renderAbout,
};
let currentRoute = "main";

// === GAME STATE ===
let insects = 0;
let insectsPerClick = 1;
let insectsPerSec = 0;
let discovered = {0: true};
let unlockedSpecies = 1;
let autoBonus = 1.0;
let buffsActive = [];
let buffsTimer = {};
let adn = 0;
let totalMutations = 0;

// === SHOP STATE ===
const shopItems = [
  {name: "Boost ADN temporaire", desc: "Double tous les gains pour 120s", type: "buff", cost: 2, action: () => { startAdnShopBuff(120, 2); }},
  {name: "Mémoire ancestrale", desc: "Les clics donnent +50% pour toujours", type: "perm", cost: 7, action: () => { shopUpgrades.click = (shopUpgrades.click||0)+.5; showNotif("Tes clics sont plus puissants !"); }},
  {name: "Écosystème fertile", desc: "Production automatique +25% pour toujours", type: "perm", cost: 12, action: () => { shopUpgrades.auto = (shopUpgrades.auto||0)+.25; showNotif("Production auto améliorée !"); }},
  {name: "Chance rare", desc: "Débloque 2 espèces supplémentaires", type: "perm", cost: 17, action: () => { unlockedSpecies = Math.min(unlockedSpecies+2, species.length); showNotif("Tu observes de nouvelles espèces !"); }},
];
let shopUpgrades = {click: 0, auto: 0};
let adnBuffShop = 0;

// === SPECIES & HABITATS ===
const species = [
  {name: "Coccinelle", emoji: "🐞", color: "#e53935", desc: "Petite et bénéfique.", chance: 0.5, baseRate: 1, rare: false, buff: "Clic chanceux"},
  {name: "Abeille", emoji: "🐝", color: "#ffd600", desc: "Pollinisatrice infatigable.", chance: 0.12, baseRate: 4, rare: false, buff: "Ruche Turbo"},
  {name: "Fourmi", emoji: "🐜", color: "#43a047", desc: "Travailleuse acharnée.", chance: 0.07, baseRate: 7, rare: false, buff: "Colonie Express"},
  {name: "Papillon", emoji: "🦋", color: "#3f51b5", desc: "Éphémère et élégant.", chance: 0.07, baseRate: 15, rare: true, buff: "Pluie de pollen"},
  {name: "Libellule", emoji: "🦗", color: "#00bcd4", desc: "Rapide et agile.", chance: 0.04, baseRate: 28, rare: true, buff: "Pluie d’insectes"},
  {name: "Scarabée", emoji: "🪲", color: "#926c33", desc: "Solide et rare.", chance: 0.022, baseRate: 60, rare: true, buff: "Scaraboost"},
  {name: "Luciole", emoji: "🪰", color: "#f6ff00", desc: "Brille dans la nuit. Active le Super Click !", chance: 0.012, baseRate: 140, rare: true, buff: "Super Click"},
  {name: "Cigale", emoji: "🦟", color: "#e6ce51", desc: "Chante l'été, booste les abeilles.", chance: 0.008, baseRate: 120, rare: true, buff: "Chant tonitruant"},
  {name: "Mante", emoji: "🕷️", color: "#81d4fa", desc: "Chasseuse rare, dope la prod auto.", chance: 0.003, baseRate: 400, rare: true, buff: "Effet Prédatrice"},
  // Tu peux en ajouter ici !
];
const habitats = [
  {name:"Terrarium à Coccinelles", rate: 1, cost: 15, species:0, owned:0},
  {name:"Ruche modeste", rate: 4, cost: 60, species:1, owned:0},
  {name:"Fourmilière", rate: 12, cost: 210, species:2, owned:0},
  {name:"Jardin à papillons", rate: 38, cost: 1100, species:3, owned:0},
  {name:"Étang à libellules", rate: 98, cost: 3800, species:4, owned:0},
  {name:"Dôme à scarabées", rate: 210, cost: 16000, species:5, owned:0},
  {name:"Boîte à lucioles", rate: 500, cost: 47000, species:6, owned:0},
  {name:"Chênaie à cigales", rate: 1350, cost: 140000, species:7, owned:0},
  {name:"Vivarium de mantes", rate: 3800, cost: 330000, species:8, owned:0},
];

// === UPGRADES, BUFFS ===
const upgrades = [
  {name:"Loupe de collectionneur", desc:"+1 insecte/clic", cost: 25, action:()=>{insectsPerClick+=1;}},
  {name:"Filet rapide", desc:"Double le gain par clic", cost: 90, action:()=>{insectsPerClick*=2;}},
  {name:"Encyclopédie entomo", desc:"Toutes espèces visibles", cost: 140, action:()=>{unlockedSpecies = species.length;}},
  {name:"Phéromones spéciales", desc:"+40% vitesse auto.", cost: 220, action:()=>{autoBonus *= 1.4;}},
  {name:"Lumière UV", desc:"+100% sur les papillons", cost: 350, action:()=>{habitats[3].rate = Math.round(habitats[3].rate*2);}},
  {name:"Super fourmilière", desc:"+100% sur toutes les fourmis", cost: 1100, action:()=>{habitats[2].rate = Math.round(habitats[2].rate*2);}},
  {name:"Colonie Royale", desc:"Débloque l'automatisation pour les espèces rares", cost: 3300, action:()=>{
    for(let h=4; h<habitats.length; ++h) habitats[h].rate=Math.round(habitats[h].rate*1.17);
  }},
  {name:"Accord Mantis", desc:"+50% production auto si Mante découverte", cost: 17000, action:()=>{autoBonus*=1.5;}},
  {name:"Stéréo-Cigale", desc:"Les abeilles produisent +80% si Cigale débloquée", cost: 33000, action:()=>{habitats[1].rate = Math.round(habitats[1].rate*1.8);}},
  {name:"Lueur Luciole", desc:"Super Click dure 10% plus longtemps", cost: 51000, action:()=>{}},
];
const buffs = [
  {name:"Clic chanceux", desc:"Prochain clic x5", duration:10, cost:55, species:0, effect:()=>{insectsPerClick*=5;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/5);}},
  {name:"Ruche Turbo", desc:"Production auto x2 (20s)", duration:20, cost:130, species:1, effect:()=>{autoBonus*=2;}, undo:()=>{autoBonus/=2;}},
  {name:"Colonie Express", desc:"Production auto x3 (10s)", duration:10, cost:260, species:2, effect:()=>{autoBonus*=3;}, undo:()=>{autoBonus/=3;}},
  {name:"Pluie de pollen", desc:"Tous les clics x2 (15s)", duration:15, cost:410, species:3, effect:()=>{insectsPerClick*=2;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/2);}},
  {name:"Pluie d’insectes", desc:"+700 insectes instantané", duration:0, cost:820, species:4, effect:()=>{insects+=700; showNotif("+700 insectes grâce à la libellule !");}, undo:()=>{}},
  {name:"Scaraboost", desc:"+3 habitats aléatoires", duration:0, cost:2050, species:5, effect:()=>{
    let count=0;
    for(let t=0;t<3;++t){
      let idx = Math.floor(Math.random()*habitats.length);
      habitats[idx].owned++;
      count++;
    }
    showNotif(`+${count} habitats grâce aux scarabées !`);
  }, undo:()=>{}},
  {name:"Super Click", desc:"10s de clics x10", duration:10, cost:6600, species:6, effect:()=>{insectsPerClick*=10;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/10);}},
  {name:"Chant tonitruant", desc:"Abeilles produisent x2 (15s)", duration:15, cost:11000, species:7, effect:()=>{habitats[1].rate *=2;}, undo:()=>{habitats[1].rate = Math.round(habitats[1].rate/2);}},
  {name:"Effet Prédatrice", desc:"+7000 insectes, prod auto x2 (12s)", duration:12, cost:22000, species:8, effect:()=>{insects+=7000; autoBonus*=2;}, undo:()=>{autoBonus/=2;}},
];

// === NOTIFICATIONS ===
function showNotif(msg) {
  const zone = document.getElementById('notifZone');
  const el = document.createElement('div');
  el.className = 'notif';
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(()=>{el.style.opacity=0;el.style.transform='scale(0.92)';}, 3200);
  setTimeout(()=>el.remove(), 4100);
}

// ==== BUFF BAR ====
function renderBuffBar() {
  const bar = document.getElementById("buffBar");
  let html = "";
  for (let i = 0; i < unlockedSpecies; ++i) {
    const b = buffs.find(bu => bu.species === i);
    if (!b) continue;
    let isActive = buffsActive.includes(i);
    html += `<button class="buff-btn-bar${isActive ? " buff-active" : ""}${insects < b.cost && !isActive ? " buff-locked":""}" 
      onclick="activateBuff(${i})" ${insects < b.cost && !isActive ? "disabled" : ""} title="${b.desc}">
        <span>${species[i].emoji}</span>
        <span style="margin-right:3px;">${b.name}</span>
        ${isActive ? `<span class="buff-timer" id="buff-timer-${i}">${buffsTimer[i] || b.duration}s</span>` : `<span class="buff-cost">${b.cost} 🐛</span>`}
      </button>`;
  }
  bar.innerHTML = html;
}
window.activateBuff = function(i){
  const b = buffs.find(bu=>bu.species===i);
  if(!b || (insects<b.cost && !buffsActive.includes(i)) || buffsActive.includes(i)) return;
  if (!buffsActive.includes(i)) insects -= b.cost;
  buffsActive.push(i);
  if (b.effect) b.effect();
  showNotif(`Buff activé : ${b.name} !`);
  renderBuffBar();
  if(b.duration>0){
    buffsTimer[i]=b.duration;
    let interval = setInterval(()=>{
      buffsTimer[i]--;
      renderBuffBar();
      if(buffsTimer[i]<=0){
        clearInterval(interval);
        buffsActive = buffsActive.filter(e=>e!==i);
        if (b.undo) b.undo();
        showNotif(`Buff terminé : ${b.name}`);
        buffsTimer[i]=null;
        renderBuffBar();
        updateUI();
      }
    },1000);
  } else {
    buffsActive = buffsActive.filter(e=>e!==i);
  }
  updateUI();
  saveGame();
}

// ==== MAIN ROUTE ====
let buyQty = 1; // Achat d'habitats en x1, x5, x10, MAX
function renderMain() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Insectarium Idle Evolution</h1>
    <div class="adn-bar" id="adnBar">
      <span style="font-size:1.18em;">🧬 ADN : <b id="adnCount">${adn}</b></span>
      <button class="up-btn" style="margin-left:10px;padding:3px 12px 3px 12px;font-size:0.99em;" id="mutationBtn" title="Réinitialise et gagne des bonus ADN">Mutation</button>
      <span style="margin-left:12px;color:#668;">(x${getGlobalBuff().toLocaleString(undefined,{maximumFractionDigits:2})} prod)</span>
    </div>
    <div class="counters">
      <span>Insectes : <span id="insects">${Math.floor(insects)}</span></span>
      <span class="sep">|</span>
      <span>Auto/sec : <span id="ips">0</span></span>
      <span class="sep">|</span>
      <span>Clic : <span id="ipc">${Math.floor(insectsPerClick * getClickBuff())}</span></span>
    </div>
    <div class="buy-qty-bar">
      <button class="buy-qty-btn${buyQty===1?' selected':''}" onclick="setBuyQty(1)">x1</button>
      <button class="buy-qty-btn${buyQty===5?' selected':''}" onclick="setBuyQty(5)">x5</button>
      <button class="buy-qty-btn${buyQty===10?' selected':''}" onclick="setBuyQty(10)">x10</button>
      <button class="buy-qty-btn${buyQty==='max'?' selected':''}" onclick="setBuyQty('max')">MAX</button>
    </div>
    <div id="insectZone" title="Clique sur la zone ou sur les insectes pour les attraper !"></div>
    <button class="big-btn" id="catchBtn">Attraper un insecte 🐞</button>
    <div class="section-title">Habitats et Automatisations</div>
    <div id="habitatList"></div>
  `;
  renderHabitats();
  document.getElementById('catchBtn').onclick = ()=>{ collectInsect(); };
  document.getElementById('mutationBtn').onclick = showMutationDialog;
  const insectZone = document.getElementById('insectZone');
  insectZone.onclick = function(e){
    if(e.target===insectZone) collectInsect();
  };
  renderBuffBar();
}
window.setBuyQty = function(q) { buyQty = q; renderHabitats(); }
function getGlobalBuff() { return (1 + adn * 0.12 + (shopUpgrades.auto||0) + adnBuffShop); }
function getClickBuff() { return getGlobalBuff() * (1+(shopUpgrades.click||0)); }
function renderHabitats() {
  let h = '';
  habitats.forEach((hab, i)=>{
    if(unlockedSpecies > hab.species){
      let qty = buyQty;
      let cost = hab.cost, owned = hab.owned, rate = hab.rate;
      let buyable = 1;
      if(qty === 'max') {
        let n = 0, money = insects;
        let curCost = hab.cost;
        while(money >= curCost) {
          money -= curCost;
          curCost = Math.round(curCost*1.28+12);
          n++;
        }
        qty = n;
      }
      if(qty>1) {
        // Combien je peux acheter ?
        let money = insects, curCost = hab.cost, n = 0;
        for(let j=0;j<qty && money>=curCost;j++) {
          money -= curCost;
          curCost = Math.round(curCost*1.28+12);
          n++;
        }
        qty = n;
      }
      let totalCost = 0, curCost = hab.cost;
      for(let j=0;j<qty;j++) {
        totalCost += curCost;
        curCost = Math.round(curCost*1.28+12);
      }
      h += `<button class="up-btn" id="hab-btn-${i}" onclick="buyHabitat(${i},${qty})" ${qty<1||insects<totalCost?'disabled':''}>
              ${hab.name} <b>(${hab.owned})</b> — +${hab.rate}/sec
              <span class="badge">x${qty||1}</span>
              <span class="badge">${totalCost} 🐛</span>
              <div style="color:#888;font-size:0.93em;">${species[hab.species].emoji} ${species[hab.species].name}</div>
            </button>`;
    }
  });
  document.getElementById('habitatList').innerHTML = h;
}
window.buyHabitat = function(i, qty) {
  let hab = habitats[i];
  let curCost = hab.cost, totalCost = 0, canBuy = 0;
  let initialOwned = hab.owned;
  for(let j=0;j<qty;j++) {
    if(insects<curCost) break;
    insects -= curCost;
    hab.owned++;
    totalCost += curCost;
    curCost = Math.round(curCost*1.28+12);
    canBuy++;
  }
  hab.cost = curCost;
  if(!discovered[hab.species] && hab.owned>0) {
    discovered[hab.species]=true;
    if(unlockedSpecies<species.length) unlockedSpecies++;
    showNotif(`Nouvelle espèce : ${species[hab.species].emoji} ${species[hab.species].name} !`);
  }
  // Effet visuel achat
  let btn = document.getElementById('hab-btn-'+i);
  if(btn) { btn.classList.add('buy-flash'); setTimeout(()=>btn.classList.remove('buy-flash'),350);}
  renderHabitats();
  updateUI();
  saveGame();
}

// ==== RENDER OTHERS ====
function renderSpecies() {
  const app = document.getElementById('app');
  let sp = `<h1>Espèces découvertes</h1><div class="species-list">`;
  for(let i=0; i<unlockedSpecies; ++i){
    let s = species[i];
    sp += `<div class="species-card">
      <span class="species-icon" style="color:${s.color};">${s.emoji}</span>
      <span class="species-name">${s.name}</span>
      ${s.rare ? '<span class="species-rare">Rare</span>' : ''}
      <div class="species-desc">${s.desc}</div>
      <div class="species-desc" style="color:#8a6800;">Buff unique : <b>${s.buff}</b></div>
    </div>`;
  }
  sp += "</div>";
  app.innerHTML = sp;
  renderBuffBar();
}
function renderUpgrades() {
  const app = document.getElementById('app');
  let u = `<h1>Améliorations</h1><div id="upgradeList">`;
  upgrades.forEach((upg,i)=>{
    if(!upg.bought)
      u += `<button class="up-btn" onclick="buyUpgrade(${i})" ${insects<upg.cost?'disabled':''}>
              <b>${upg.name}</b> — ${upg.desc} <span style="float:right;">${upg.cost} 🐛</span>
            </button>`;
  });
  u += `</div>
    <div style="margin-top:13px;color:#577;">Certaines améliorations dépendent d'espèces rares ou d'une progression avancée.</div>`;
  app.innerHTML = u;
  renderBuffBar();
}
window.buyUpgrade = function(i){
  if(insects >= upgrades[i].cost && !upgrades[i].bought){
    insects -= upgrades[i].cost;
    upgrades[i].bought = true;
    upgrades[i].action();
    showNotif(`Amélioration obtenue : ${upgrades[i].name}`);
    updateUI();
    saveGame();
    renderUpgrades();
  }
}

// ==== BOUTIQUE ADN ====
function renderShop() {
  const app = document.getElementById('app');
  let s = `<h1>Boutique ADN</h1>
    <div class="adn-bar" style="margin-bottom:12px;">
      <span>ADN disponible : <b id="adnCount">${adn}</b></span>
      <span style="margin-left:18px;">Boost global actuel : <b>x${getGlobalBuff().toLocaleString(undefined,{maximumFractionDigits:2})}</b></span>
    </div>
    <div id="shopList">`;
  shopItems.forEach((item,i)=>{
    s += `<button class="shop-btn" onclick="buyShopItem(${i})" ${adn<item.cost?'disabled':''}>
      <b>${item.name}</b> <span class="badge">${item.cost} 🧬</span><br>
      <span style="font-size:0.98em;color:#666;">${item.desc}</span>
    </button>`;
  });
  s += "</div>";
  app.innerHTML = s;
  renderBuffBar();
}
window.buyShopItem = function(i){
  if(adn < shopItems[i].cost) return;
  adn -= shopItems[i].cost;
  shopItems[i].action();
  showNotif(`Achat réussi : ${shopItems[i].name}`);
  updateUI();
  saveGame();
  renderShop();
}
// Buff temporaire acheté dans la boutique
function startAdnShopBuff(dur, mult) {
  adnBuffShop += mult;
  renderBuffBar();
  showNotif("Buff ADN temporaire activé !");
  setTimeout(()=>{
    adnBuffShop -= mult;
    showNotif("Buff ADN boutique terminé.");
    renderBuffBar();
    updateUI();
  }, dur*1000);
}

// ==== BUFFS (page) ====
function renderBuffs() {
  // Non utilisée, buffs sont désormais dans la barre flottante partout
}

// ==== ABOUT ====
function renderAbout() {
  document.getElementById('app').innerHTML = `
    <h1>À propos</h1>
    <p>Jeu créé avec ❤️ par ChatGPT & l'utilisateur.<br>
    <b>Version Evolution – mai 2025</b>
    <ul>
      <li>Boutique ADN, upgrades permanents/temporaires</li>
      <li>Buffs accessibles partout</li>
      <li>Espèces, buffs, upgrades, habitats rares</li>
      <li>Sauvegarde automatique, feedbacks visuels, code modulaire</li>
      <li>Achat habitats x1/x5/x10/MAX</li>
    </ul>
    <span style="color:#43a047;">Bonne mutation !</span>
    </p>
    <div style="margin:20px 0 0 0;font-size:0.95em;">Repo Github : ajoute, modifie, partage !</div>
  `;
  renderBuffBar();
}

// ==== MUTATION / ADN / PRESTIGE ====
function showMutationDialog() {
  const rareSpecies = Object.keys(discovered).map(i=>species[i]).filter(s=>s && s.rare).length;
  const gain = Math.floor(Math.sqrt(insects/1200)) + rareSpecies;
  if(gain<=0) {
    showNotif("Accumule plus d'insectes pour muter !");
    return;
  }
  if(confirm(
    `Tu es sur le point de MUTER.\n\nTu obtiendras ${gain} 🧬 ADN (+${rareSpecies} pour espèces rares).\nCela va réinitialiser tous tes progrès insectes/habitats/upgrades, mais pas ton ADN ou ses bonus.\n\nContinuer ?`
  )) {
    performMutation(gain);
  }
}
function performMutation(gain) {
  insects = 0; insectsPerClick = 1; autoBonus = 1.0; unlockedSpecies = 1;
  habitats.forEach((h,i)=>{ h.owned=0; h.cost=[15,60,210,1100,3800,16000,47000,140000,330000][i]; });
  upgrades.forEach(u=>u.bought=false);
  discovered = {0:true};
  adn += gain;
  totalMutations += 1;
  showNotif(`Mutation réussie ! +${gain} 🧬 ADN`);
  saveGame();
  goto("main");
  updateUI();
  renderBuffBar();
}

// ==== INSECTE CLIC & ANIMATION ====
function collectInsect(val){
  let value = (val||insectsPerClick) * getClickBuff();
  insects += value;
  updateUI();
  animBurst(Math.floor(value));
  saveGame();
}

function spawnInsectAnim(){
  let pool=[];
  for(let i=0;i<unlockedSpecies;++i){
    for(let k=0; k<Math.floor(species[i].chance*100);++k) pool.push(i);
  }
  let idx = pool[Math.floor(Math.random()*pool.length)]||0;
  const spec = species[idx];
  const el = document.createElement('div');
  el.className = 'insect';
  el.style.left = (15+Math.random()*330)+'px';
  el.style.top = (12+Math.random()*92)+'px';
  el.innerHTML = `<span style="font-size:2em;">${spec.emoji}</span>`;
  const insectZone = document.getElementById('insectZone');
  if(insectZone) {
    insectZone.appendChild(el);
    let dx = -1 + 2*Math.random();
    let dy = -1 + 2*Math.random();
    let t = 0, maxT = 44+Math.random()*48;
    function anim(){
      t++;
      let posX = parseFloat(el.style.left);
      let posY = parseFloat(el.style.top);
      el.style.left = (Math.max(0, Math.min(340,posX+dx*2)))+"px";
      el.style.top = (Math.max(0, Math.min(100,posY+dy*1.7)))+"px";
      if(t>maxT){
        el.remove();
        return;
      }
      requestAnimationFrame(anim);
    }
    anim();
    el.onclick = (e)=>{
      e.stopPropagation();
      collectInsect(spec.baseRate*2);
      el.style.transform="scale(1.33)";
      el.style.filter = "drop-shadow(0 2px 18px #90caf9aa)";
      setTimeout(()=>el.remove(),140);
    };
  }
}
function animBurst(val){
  const insectZone = document.getElementById('insectZone');
  if(!insectZone) return;
  const burst = document.createElement('span');
  burst.className = "burst";
  burst.textContent = "+"+val;
  burst.style.left = (170+Math.random()*50)+'px';
  burst.style.top = (80+Math.random()*25)+'px';
  insectZone.appendChild(burst);
  setTimeout(()=>burst.remove(), 770);
}

// ==== GAME LOOP ====
function updateUI() {
  let globalBuff = getGlobalBuff(), clickBuff = getClickBuff();
  if(currentRoute==="main"){
    document.getElementById('insects').textContent = Math.floor(insects);
    let ips = 0;
    habitats.forEach(hab=>{
      if(hab.owned) ips += hab.owned*hab.rate;
    });
    ips = Math.round(ips * autoBonus * globalBuff);
    insectsPerSec = ips;
    document.getElementById('ips').textContent = insectsPerSec;
    document.getElementById('ipc').textContent = Math.floor(insectsPerClick*clickBuff);
    if(document.getElementById('adnCount')) document.getElementById('adnCount').textContent = adn;
    renderHabitats();
  }
  if(document.getElementById('adnCount')) document.getElementById('adnCount').textContent = adn;
}
setInterval(()=>{
  insects += insectsPerSec/10;
  updateUI();
  saveGame();
},100);
setInterval(()=>{
  if(currentRoute==="main") spawnInsectAnim();
}, 1200);

// ==== INIT ====
document.querySelectorAll('.route-btn').forEach(btn => {
  btn.onclick = ()=>goto(btn.dataset.route);
});
function goto(route) {
  if (!routes[route]) return;
  currentRoute = route;
  document.querySelectorAll('.route-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-route="${route}"]`).classList.add('active');
  routes[route]();
  renderBuffBar();
}
goto("main");

// ==== SAVE/LOAD ====
function saveGame() {
  const state = {
    insects, insectsPerClick, autoBonus, unlockedSpecies, adn, totalMutations, shopUpgrades,
    habitats: habitats.map(h=>({owned:h.owned, cost:h.cost})),
    upgrades: upgrades.map(u=>!!u.bought)
  };
  localStorage.setItem("insectIdleEvolutionSave", JSON.stringify(state));
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem("insectIdleEvolutionSave"));
    if(!s) return;
    insects = s.insects||0;
    insectsPerClick = s.insectsPerClick||1;
    autoBonus = s.autoBonus||1.0;
    unlockedSpecies = s.unlockedSpecies||1;
    adn = s.adn||0;
    totalMutations = s.totalMutations||0;
    shopUpgrades = s.shopUpgrades||{click:0,auto:0};
    s.habitats && s.habitats.forEach((h,i)=>{
      if(habitats[i]){
        habitats[i].owned = h.owned||0;
        habitats[i].cost = h.cost||habitats[i].cost;
        if(habitats[i].owned>0 && !discovered[habitats[i].species]){
          discovered[habitats[i].species]=true;
          if(unlockedSpecies<species.length) unlockedSpecies++;
        }
      }
    });
    s.upgrades && s.upgrades.forEach((b,i)=>upgrades[i]&&(upgrades[i].bought=b));
  } catch(e){}
}
loadGame();
updateUI();
renderBuffBar();
