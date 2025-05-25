// --- DATA ---
let insects = 0;
let insectsPerClick = 1;
let insectsPerSec = 0;
let discovered = {0: true};
let unlockedSpecies = 1; // How many species are visible in UI
let autoBonus = 1.0;

// --- Species ---
const species = [
  {name: "Coccinelle", emoji: "🐞", color: "#e53935", desc: "Petite et bénéfique.", chance: 0.70, baseRate: 1},
  {name: "Abeille", emoji: "🐝", color: "#ffd600", desc: "Pollinisatrice infatigable.", chance: 0.13, baseRate: 4},
  {name: "Fourmi", emoji: "🐜", color: "#43a047", desc: "Travailleuse acharnée.", chance: 0.07, baseRate: 7},
  {name: "Papillon", emoji: "🦋", color: "#3f51b5", desc: "Éphémère et élégant.", chance: 0.06, baseRate: 13},
  {name: "Libellule", emoji: "🦗", color: "#00bcd4", desc: "Rapide et agile.", chance: 0.04, baseRate: 25}
];

// --- Habitats (Auto-Increment) ---
const habitats = [
  {name:"Terrarium à Coccinelles", rate: 1, cost: 15, species:0, owned:0},
  {name:"Ruche modeste", rate: 4, cost: 60, species:1, owned:0},
  {name:"Fourmilière", rate: 12, cost: 200, species:2, owned:0},
  {name:"Jardin à papillons", rate: 32, cost: 1000, species:3, owned:0},
  {name:"Étang à libellules", rate: 80, cost: 3300, species:4, owned:0}
];

// --- Upgrades ---
const upgrades = [
  {name:"Loupe de collectionneur", desc:"+1 insecte/clic", cost: 25, action:()=>{insectsPerClick+=1;}},
  {name:"Filet rapide", desc:"Double le gain par clic", cost: 90, action:()=>{insectsPerClick*=2;}},
  {name:"Encyclopédie entomo", desc:"Débloque toutes les espèces (visibles)", cost: 140, action:()=>{unlockedSpecies = species.length;}},
  {name:"Phéromones spéciales", desc:"+40% vitesse auto.", cost: 220, action:()=>{autoBonus *= 1.4;}},
  {name:"Lumière UV", desc:"+100% sur les papillons", cost: 350, action:()=>{habitats[3].rate = Math.round(habitats[3].rate*2);}},
];

// --- UI update ---
function updateUI() {
  document.getElementById('insects').textContent = Math.floor(insects);
  // Habitats
  let h = '';
  habitats.forEach((hab, i)=>{
    if(unlockedSpecies > hab.species){
      h += `<button class="up-btn" onclick="buyHabitat(${i})" ${insects<hab.cost?'disabled':''}>
              ${hab.name} <b>(${hab.owned})</b> — +${hab.rate}/sec — <b>${hab.cost} 🐛</b><br>
              <span style="color:#888;font-size:0.93em;">${species[hab.species].emoji} ${species[hab.species].name}</span>
            </button>`;
    }
  });
  document.getElementById('habitatList').innerHTML = h;
  // Upgrades
  let u = '';
  upgrades.forEach((upg,i)=>{
    if(!upg.bought)
      u += `<button class="up-btn" onclick="buyUpgrade(${i})" ${insects<upg.cost?'disabled':''}>
              <b>${upg.name}</b> — ${upg.desc} <span style="float:right;">${upg.cost} 🐛</span>
            </button>`;
  });
  document.getElementById('upgradeList').innerHTML = u;
  // Species bar
  let sp = '';
  for(let i=0; i<unlockedSpecies; ++i){
    sp += `<span class="species-bar">
      <span class="species-icon" style="color:${species[i].color};">${species[i].emoji}</span>
      ${species[i].name}
    </span>`;
  }
  document.getElementById('speciesList').innerHTML = sp;
  // Auto/sec
  insectsPerSec = 0;
  habitats.forEach(hab=>{
    if(hab.owned) insectsPerSec += hab.owned*hab.rate;
  });
  insectsPerSec = Math.round(insectsPerSec * autoBonus);
  document.getElementById('ips').textContent = insectsPerSec;
}

// --- Achat habitat
window.buyHabitat = function(i){
  if(insects >= habitats[i].cost){
    insects -= habitats[i].cost;
    habitats[i].owned++;
    habitats[i].cost = Math.round(habitats[i].cost*1.37+5);
    // Découverte d'espèce
    if(!discovered[habitats[i].species]) {
      discovered[habitats[i].species]=true;
      if(unlockedSpecies<species.length) unlockedSpecies++;
    }
    updateUI();
    saveGame();
  }
}
// --- Achat upgrade
window.buyUpgrade = function(i){
  if(insects >= upgrades[i].cost && !upgrades[i].bought){
    insects -= upgrades[i].cost;
    upgrades[i].bought = true;
    upgrades[i].action();
    updateUI();
    saveGame();
  }
}

// --- Collecte via clic bouton
document.getElementById('catchBtn').onclick = ()=>{ collectInsect(); };

// --- Animation insecte et clics dans la zone
const insectZone = document.getElementById('insectZone');
function spawnInsectAnim(){
  // Pool pondérée sur les espèces découvertes
  let pool=[];
  for(let i=0;i<unlockedSpecies;++i){
    for(let k=0; k<Math.floor(species[i].chance*100);++k) pool.push(i);
  }
  let idx = pool[Math.floor(Math.random()*pool.length)]||0;
  const spec = species[idx];
  const el = document.createElement('div');
  el.className = 'insect';
  el.style.left = (15+Math.random()*320)+'px';
  el.style.top = (12+Math.random()*80)+'px';
  el.innerHTML = `<span style="font-size:2em;">${spec.emoji}</span>`;
  insectZone.appendChild(el);

  // Animation déplacement flottant
  let dx = -1 + 2*Math.random();
  let dy = -1 + 2*Math.random();
  let t = 0, maxT = 55+Math.random()*35;
  function anim(){
    t++;
    let posX = parseFloat(el.style.left);
    let posY = parseFloat(el.style.top);
    el.style.left = (Math.max(0, Math.min(330,posX+dx*2)))+"px";
    el.style.top = (Math.max(0, Math.min(90,posY+dy*1.5)))+"px";
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
    el.style.transform="scale(1.34)";
    setTimeout(()=>el.remove(),150);
  };
}
function collectInsect(val){
  val = val||insectsPerClick;
  insects += val;
  updateUI();
  animBurst(val);
  saveGame();
}
insectZone.onclick = function(e){
  if(e.target===insectZone) collectInsect();
};
// Animation Burst
function animBurst(val){
  const burst = document.createElement('span');
  burst.className = "burst";
  burst.textContent = "+"+val;
  burst.style.left = (180+Math.random()*30)+'px';
  burst.style.top = (75+Math.random()*25)+'px';
  insectZone.appendChild(burst);
  let t=0;
  let anim = ()=> {
    t++;
    burst.style.top = (parseFloat(burst.style.top)-1.2)+'px';
    burst.style.opacity = 1-t/22;
    if(t<20) requestAnimationFrame(anim);
    else burst.remove();
  };
  anim();
}

// --- Boucle principale (auto income, spawns, unlock)
setInterval(()=>{
  insects += insectsPerSec/10;
  updateUI();
  saveGame();
},100); // 0.1s tick

setInterval(()=>{
  spawnInsectAnim();
}, 1400);

// --- Sauvegarde automatique locale ---
function saveGame() {
  // Encodage simple (tout sauf fonctions)
  const state = {
    insects, insectsPerClick, autoBonus, unlockedSpecies,
    habitats: habitats.map(h=>({owned:h.owned, cost:h.cost})),
    upgrades: upgrades.map(u=>!!u.bought)
  };
  localStorage.setItem("insectIdleSave", JSON.stringify(state));
}

function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem("insectIdleSave"));
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

// --- Pour faciliter le debug/évolution : reset possible dans la console : localStorage.clear()
