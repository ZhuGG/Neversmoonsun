// === ROUTING & STATE ===
const routes = {
  main: renderMain,
  species: renderSpecies,
  upgrades: renderUpgrades,
  buffs: renderBuffs,
  about: renderAbout,
};
let currentRoute = "main";

let insects = 0;
let insectsPerClick = 1;
let insectsPerSec = 0;
let discovered = {0: true};
let unlockedSpecies = 1;
let autoBonus = 1.0;
let buffsActive = [];
let buffsAvailable = [];
let buffsTimer = {};

const species = [
  {name: "Coccinelle", emoji: "🐞", color: "#e53935", desc: "Petite et bénéfique.", chance: 0.66, baseRate: 1, rare: false, buff: "Clic chanceux"},
  {name: "Abeille", emoji: "🐝", color: "#ffd600", desc: "Pollinisatrice infatigable.", chance: 0.13, baseRate: 4, rare: false, buff: "Ruche Turbo"},
  {name: "Fourmi", emoji: "🐜", color: "#43a047", desc: "Travailleuse acharnée.", chance: 0.08, baseRate: 7, rare: false, buff: "Colonie Express"},
  {name: "Papillon", emoji: "🦋", color: "#3f51b5", desc: "Éphémère et élégant.", chance: 0.06, baseRate: 13, rare: true, buff: "Pluie de pollen"},
  {name: "Libellule", emoji: "🦗", color: "#00bcd4", desc: "Rapide et agile.", chance: 0.035, baseRate: 25, rare: true, buff: "Pluie d’insectes"},
  {name: "Scarabée", emoji: "🪲", color: "#926c33", desc: "Solide et rare.", chance: 0.018, baseRate: 60, rare: true, buff: "Scaraboost"},
  {name: "Luciole", emoji: "🪰", color: "#f6ff00", desc: "Brille dans la nuit. Active le Super Click !", chance: 0.007, baseRate: 130, rare: true, buff: "Super Click"},
];

const habitats = [
  {name:"Terrarium à Coccinelles", rate: 1, cost: 15, species:0, owned:0},
  {name:"Ruche modeste", rate: 4, cost: 60, species:1, owned:0},
  {name:"Fourmilière", rate: 12, cost: 200, species:2, owned:0},
  {name:"Jardin à papillons", rate: 32, cost: 1000, species:3, owned:0},
  {name:"Étang à libellules", rate: 80, cost: 3300, species:4, owned:0},
  {name:"Dôme à scarabées", rate: 180, cost: 12000, species:5, owned:0},
  {name:"Boîte à lucioles", rate: 420, cost: 39000, species:6, owned:0},
];

const upgrades = [
  {name:"Loupe de collectionneur", desc:"+1 insecte/clic", cost: 25, action:()=>{insectsPerClick+=1;}},
  {name:"Filet rapide", desc:"Double le gain par clic", cost: 90, action:()=>{insectsPerClick*=2;}},
  {name:"Encyclopédie entomo", desc:"Toutes espèces visibles", cost: 140, action:()=>{unlockedSpecies = species.length;}},
  {name:"Phéromones spéciales", desc:"+40% vitesse auto.", cost: 220, action:()=>{autoBonus *= 1.4;}},
  {name:"Lumière UV", desc:"+100% sur les papillons", cost: 350, action:()=>{habitats[3].rate = Math.round(habitats[3].rate*2);}},
  {name:"Super fourmilière", desc:"+100% sur toutes les fourmis", cost: 1300, action:()=>{habitats[2].rate = Math.round(habitats[2].rate*2);}},
  {name:"Colonie Royale", desc:"Débloque l'automatisation pour les espèces rares", cost: 3500, action:()=>{
    for(let h=4; h<habitats.length; ++h) habitats[h].rate*=1.15;
  }},
];

const buffs = [
  {name:"Clic chanceux", desc:"Prochain clic x5", duration:10, cost:50, species:0, effect:()=>{insectsPerClick*=5;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/5);}},
  {name:"Ruche Turbo", desc:"Production auto x2 (20s)", duration:20, cost:100, species:1, effect:()=>{autoBonus*=2;}, undo:()=>{autoBonus/=2;}},
  {name:"Colonie Express", desc:"Production auto x3 (10s)", duration:10, cost:220, species:2, effect:()=>{autoBonus*=3;}, undo:()=>{autoBonus/=3;}},
  {name:"Pluie de pollen", desc:"Tous les clics x2 (15s)", duration:15, cost:340, species:3, effect:()=>{insectsPerClick*=2;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/2);}},
  {name:"Pluie d’insectes", desc:"+500 insectes instantané", duration:0, cost:570, species:4, effect:()=>{insects+=500; showNotif("+500 insectes grâce à la libellule !");}, undo:()=>{}},
  {name:"Scaraboost", desc:"+3 habitats aléatoires", duration:0, cost:1700, species:5, effect:()=>{
    let count=0;
    for(let t=0;t<3;++t){
      let idx = Math.floor(Math.random()*habitats.length);
      habitats[idx].owned++;
      count++;
    }
    showNotif(`+${count} habitats grâce aux scarabées !`);
  }, undo:()=>{}},
  {name:"Super Click", desc:"10s de clics x10", duration:10, cost:4100, species:6, effect:()=>{insectsPerClick*=10;}, undo:()=>{insectsPerClick=Math.max(1, insectsPerClick/10);}},
];

// === NOTIF SYSTEM ===
function showNotif(msg) {
  const zone = document.getElementById('notifZone');
  const el = document.createElement('div');
  el.className = 'notif';
  el.textContent = msg;
  zone.appendChild(el);
  setTimeout(()=>{el.style.opacity=0;el.style.transform='scale(0.92)';}, 3400);
  setTimeout(()=>el.remove(), 4100);
}

// === ROUTING ===
function goto(route) {
  if (!routes[route]) return;
  currentRoute = route;
  // Set active class on navbar
  document.querySelectorAll('.route-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-route="${route}"]`).classList.add('active');
  // Render view
  routes[route]();
}

// === MAIN VIEW ===
function renderMain() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h1>Insectarium Idle Deluxe</h1>
    <div class="counters">
      <span>Insectes : <span id="insects">${Math.floor(insects)}</span></span>
      <span class="sep">|</span>
      <span>Auto/sec : <span id="ips">0</span></span>
      <span class="sep">|</span>
      <span>Clic : <span id="ipc">${insectsPerClick}</span></span>
    </div>
    <div id="insectZone" title="Clique sur la zone ou sur les insectes pour les attraper !"></div>
    <button class="big-btn" id="catchBtn">Attraper un insecte 🐞</button>
    <div class="section-title">Habitats et Automatisations</div>
    <div id="habitatList"></div>
  `;
  renderHabitats();
  updateUI();
  document.getElementById('catchBtn').onclick = ()=>{ collectInsect(); };
  // Animation + clic zone
  const insectZone = document.getElementById('insectZone');
  insectZone.onclick = function(e){
    if(e.target===insectZone) collectInsect();
  };
}
function renderHabitats() {
  let h = '';
  habitats.forEach((hab, i)=>{
    if(unlockedSpecies > hab.species){
      h += `<button class="up-btn" onclick="buyHabitat(${i})" ${insects<hab.cost?'disabled':''}>
              ${hab.name} <b>(${hab.owned})</b> — +${hab.rate}/sec — <b>${hab.cost} 🐛</b>
              <div style="color:#888;font-size:0.93em;">${species[hab.species].emoji} ${species[hab.species].name}</div>
            </button>`;
    }
  });
  document.getElementById('habitatList').innerHTML = h;
}

// === ESPÈCES ===
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
}

// === UPGRADES ===
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
}

// === BUFFS & BONUS ===
function renderBuffs() {
  const app = document.getElementById('app');
  let bl = `<h1>Buffs & Bonus</h1>
    <div id="buffList">`;
  for(let i=0; i<unlockedSpecies; ++i){
    const b = buffs.find(bu => bu.species===i);
    if(b) {
      let isActive = buffsActive.includes(i);
      bl += `<button class="buff-btn${isActive ? " buff-active":""}" onclick="activateBuff(${i})" ${insects<b.cost||isActive?'disabled':''}>
        <span>${species[i].emoji}</span>
        <b>${b.name}</b> — ${b.desc}
        <span class="badge">${b.cost} 🐛</span>
        ${isActive ? `<span class="badge">⏳ ${buffsTimer[i]||b.duration}s</span>` : ""}
      </button>`;
    }
  }
  bl += "</div><div style='margin-top:12px;font-size:0.97em;color:#556b2f;'>Chaque buff est lié à une espèce : découvre-les pour débloquer plus de bonus !</div>";
  app.innerHTML = bl;
}

// === À PROPOS ===
function renderAbout() {
  document.getElementById('app').innerHTML = `
    <h1>À propos</h1>
    <p>Jeu créé avec ❤️ par ChatGPT & l'utilisateur. <br>
    <b>Version évolutive – mai 2025</b>
    <ul>
      <li>Plus de 7 espèces, buffs, habitats rares</li>
      <li>Sauvegarde automatique</li>
      <li>Routing et évolutivité pour futures features</li>
      <li>Animations, événements et notifications</li>
      <li>Inspiré par Cookie Clicker, Egg Inc, AdVenture Capitalist, et l'amour des insectes</li>
    </ul>
    <span style="color:#43a047;">En avant, explorateur d'insectarium !</span>
    </p>
    <div style="margin:20px 0 0 0;font-size:0.95em;">Github, suggestions, améliorations : contacte ChatGPT !</div>
  `;
}

// === BUY / LOGIC ===
window.buyHabitat = function(i){
  if(insects >= habitats[i].cost){
    insects -= habitats[i].cost;
    habitats[i].owned++;
    habitats[i].cost = Math.round(habitats[i].cost*1.32+8);
    // Découverte d'espèce
    if(!discovered[habitats[i].species]) {
      discovered[habitats[i].species]=true;
      if(unlockedSpecies<species.length) unlockedSpecies++;
      showNotif(`Nouvelle espèce : ${species[habitats[i].species].emoji} ${species[habitats[i].species].name} !`);
    }
    renderHabitats();
    updateUI();
    saveGame();
  }
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
window.activateBuff = function(i){
  const b = buffs.find(bu=>bu.species===i);
  if(!b || insects<b.cost || buffsActive.includes(i)) return;
  insects -= b.cost;
  buffsActive.push(i);
  if (b.effect) b.effect();
  showNotif(`Buff activé : ${b.name} !`);
  if(b.duration>0){
    buffsTimer[i]=b.duration;
    let interval = setInterval(()=>{
      buffsTimer[i]--;
      if(currentRoute==="buffs") renderBuffs();
      if(buffsTimer[i]<=0){
        clearInterval(interval);
        buffsActive = buffsActive.filter(e=>e!==i);
        if (b.undo) b.undo();
        showNotif(`Buff terminé : ${b.name}`);
        buffsTimer[i]=null;
        if(currentRoute==="buffs") renderBuffs();
        updateUI();
      }
    },1000);
  } else {
    buffsActive = buffsActive.filter(e=>e!==i);
  }
  updateUI();
  saveGame();
}

// === COLLECT + ANIMATIONS ===
function collectInsect(val){
  val = val||insectsPerClick;
  insects += val;
  updateUI();
  animBurst(val);
  saveGame();
}

// -- Insect Animation --
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
    // Animation
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
    // Clic sur l'insecte animé = bonus
    el.onclick = (e)=>{
      e.stopPropagation();
      collectInsect(spec.baseRate*2); // Bonus!
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
  let t=0;
  let anim = ()=> {
    t++;
    burst.style.top = (parseFloat(burst.style.top)-1.2)+'px';
    burst.style.opacity = 1-t/21;
    if(t<19) requestAnimationFrame(anim);
    else burst.remove();
  };
  anim();
}

// === BOUCLE PRINCIPALE ===
function updateUI() {
  // Update main counters if on main
  if(currentRoute==="main"){
    document.getElementById('insects').textContent = Math.floor(insects);
    let ips = 0;
    habitats.forEach(hab=>{
      if(hab.owned) ips += hab.owned*hab.rate;
    });
    ips = Math.round(ips * autoBonus);
    insectsPerSec = ips;
    document.getElementById('ips').textContent = insectsPerSec;
    document.getElementById('ipc').textContent = insectsPerClick;
    renderHabitats();
  }
}
setInterval(()=>{
  insects += insectsPerSec/10;
  updateUI();
  saveGame();
},100); // 0.1s tick
setInterval(()=>{
  if(currentRoute==="main") spawnInsectAnim();
}, 1200);

// === NAVBAR INIT + INIT RENDER ===
document.querySelectorAll('.route-btn').forEach(btn => {
  btn.onclick = ()=>goto(btn.dataset.route);
});
goto("main");

// === SAUVEGARDE AUTO ===
function saveGame() {
  const state = {
    insects, insectsPerClick, autoBonus, unlockedSpecies,
    habitats: habitats.map(h=>({owned:h.owned, cost:h.cost})),
    upgrades: upgrades.map(u=>!!u.bought)
  };
  localStorage.setItem("insectIdleDeluxeSave", JSON.stringify(state));
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem("insectIdleDeluxeSave"));
    if(!s) return;
    insects = s.insects||0;
    insectsPerClick = s.insectsPerClick||1;
    autoBonus = s.autoBonus||1.0;
    unlockedSpecies = s.unlockedSpecies||1;
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
