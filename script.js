const API_URL = "http://192.168.1.24:8000"; 
        
let seanceEnCours = null;
let itemsBrouillon = [];
let sortableBrouillon = null;
let sortablePratique = null;
let editVocabId = null;
let editDraftIndex = null;

let vocabulaireCache = [];
let licksPratiquesSession = new Set();
let carnetCategorieActive = null;

let currentFilterBiblio = 'Toutes';
let currentFilterCarnet = 'Toutes';
let currentSortBiblio = 'nom_asc';
let currentSortCarnet = 'prat_asc';
let searchQueryBiblio = '';
let searchQueryCarnet = '';

let showFavBiblio = false;
let showFavCarnet = false;

let routinesCache = [];

const POMODORO_WORK_SEC = 50 * 60; 
const POMODORO_BREAK_SEC = 5 * 60; 

let globalTimerData = { remaining: POMODORO_WORK_SEC, isRunning: false, isBreakPending: false, endTime: null, interval: null };
let breakTimerData = { interval: null, endTime: null };

let sessionRealTime = 0;

const SOUS_CATEGORIES = {
    "Licks": ["II V I majeur court", "II V I majeur long", "II V I mineur court", "II V I mineur long", "I VI II V", "Blues majeur", "Blues mineur", "Autres"],
    "Patterns": ["Majeur", "Mineur", "Dominante", "Pentatonique", "Autres"]
};

let activeTimer = { 
    index: null, interval: null, endTime: null, overtimeStartTime: null,
    remainingSecsAtPause: 0, isOvertime: false, isPaused: false 
};

let audioContext = null;
let metronome = { isPlaying: false, tempo: 100, nextNoteTime: 0.0, timerWorker: null, currentBtn: null };

function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
}

const svgPauseSquare = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; margin: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
const svgPlaySquare = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; margin: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const svgPlaySmall = `<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const svgMetronome = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 4px;"><path d="m4 20 4-16h8l4 16Z"/><path d="M12 20v-8"/><circle cx="12" cy="12" r="2"/><path d="m12 10 4-6"/></svg>`;
const svgMetronomeActive = `<svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 4px;"><path d="m4 20 4-16h8l4 16Z"/><path d="M12 20v-8"/><circle cx="12" cy="12" r="2"/><path d="m12 10-4-6"/></svg>`;
const svgPauseSmall = `<svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 4px;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

const svgSave = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 8px;"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>`;
const svgSaveCheck = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 8px;"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/><path d="m9 15 2 2 4-4"/></svg>`;
const svgTick = `<svg viewBox="0 0 16 16" style="width: 16px; height: 16px; fill: currentColor; margin-right: 8px;"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>`;
const svgTickNoMargin = `<svg viewBox="0 0 16 16" style="width: 16px; height: 16px; fill: currentColor; margin: 0;"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>`;

const svgTrash = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin: 0;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
const svgPencil = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin: 0;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;

const svgHeartOutline = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin: 0;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
const svgHeartFilled = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin: 0;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

function formatDureeHistorique(minutes) {
    if (minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}h${m}`;
}

function formatTonalite(tonalite) {
    if (!tonalite) return "";
    return tonalite.replace(/b( majeur| mineur)/g, '♭$1').replace(/#( majeur| mineur)/g, '♯$1');
}

function afficherVue(nomVue) {
    document.getElementById('vue-pratique').classList.remove('vue-active');
    document.getElementById('vue-creation').classList.remove('vue-active');
    document.getElementById('vue-historique').classList.remove('vue-active');
    document.getElementById('vue-bibliotheque').classList.remove('vue-active');
    
    const btnHist = document.getElementById('btn-nav-historique');
    const btnBiblio = document.getElementById('btn-nav-biblio');
    const btnRetour = document.getElementById('btn-nav-retour');
    const btnNouvelle = document.getElementById('btn-nav-nouvelle');

    btnHist.style.backgroundColor = ''; btnHist.style.borderColor = '';
    btnBiblio.style.backgroundColor = ''; btnBiblio.style.borderColor = '';

    if (nomVue === 'pratique') {
        document.getElementById('vue-pratique').classList.add('vue-active');
        btnRetour.style.display = 'none'; btnNouvelle.style.display = 'inline-flex';
    } else if (nomVue === 'creation') {
        document.getElementById('vue-creation').classList.add('vue-active');
        btnRetour.style.display = seanceEnCours ? 'inline-flex' : 'none'; btnNouvelle.style.display = 'none';
        itemsBrouillon = []; afficherBrouillon();
    } else if (nomVue === 'historique') {
        document.getElementById('vue-historique').classList.add('vue-active');
        btnHist.style.backgroundColor = 'rgba(177, 186, 196, 0.15)'; btnHist.style.borderColor = 'var(--text-muted)';
        btnRetour.style.display = seanceEnCours ? 'inline-flex' : 'none'; btnNouvelle.style.display = 'inline-flex';
        chargerHistorique();
    } else if (nomVue === 'bibliotheque') {
        document.getElementById('vue-bibliotheque').classList.add('vue-active');
        btnBiblio.style.backgroundColor = 'rgba(177, 186, 196, 0.15)'; btnBiblio.style.borderColor = 'var(--text-muted)';
        btnRetour.style.display = seanceEnCours ? 'inline-flex' : 'none'; btnNouvelle.style.display = 'inline-flex';
        chargerVocabulaireApi(); 
        gererSousCategoriesForm();
    }
}

async function chargerDerniereSeance() {
    try {
        const reponse = await fetch(`${API_URL}/seances`); const seances = await reponse.json();
        const seanceActive = seances.find(s => s.statut !== 'terminee');
        if(seanceActive) { 
            seanceEnCours = seanceActive; 
            sessionRealTime = parseInt(localStorage.getItem('session_time_' + seanceEnCours.id)) || 0;
            afficherSeancePratique(); afficherVue('pratique'); 
        } 
        else { seanceEnCours = null; afficherVue('historique'); }
    } catch (erreur) { console.error(erreur); }
}

function afficherSeancePratique() {
    if(!seanceEnCours) return;
    const [y, m, d] = seanceEnCours.date_seance.split('-');
    const dateBrute = new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateFormatee = dateBrute.toLowerCase();
    
    document.getElementById('titre-date').textContent = "Séance du " + dateFormatee;
    document.getElementById('tonalite').textContent = "Tonalité principale : " + formatTonalite(seanceEnCours.tonalite_du_jour);
    const conteneur = document.getElementById('conteneur-items'); conteneur.innerHTML = "";
    
    const btnPause = document.getElementById('btn-pause-global');
    btnPause.disabled = true; btnPause.innerHTML = svgPauseSquare; btnPause.className = 'btn-action btn-ghost-neutral btn-square';
    
    if (activeTimer.interval) clearInterval(activeTimer.interval);
    activeTimer.index = null; activeTimer.isPaused = false; stopMetronome(); 

    seanceEnCours.items.forEach((item, index) => {
        const div = document.createElement('div');
        div.id = `card-${index}`; div.className = `item-card ${item.fait ? 'done' : ''}`;
        div.onclick = () => gererClicCarte(index);
        
        let badges = `<div class="badges-container">`;
        if(item.tempo) badges += `<button class="badge badge-tempo" onclick="toggleMetronome(${item.tempo}, event, this)">${svgMetronome} ${item.tempo} bpm</button>`;
        if(item.type_gamme) badges += `<span class="badge badge-neutral">${item.type_gamme}</span>`;
        if(item.mains) badges += `<span class="badge badge-neutral">${item.mains}</span>`;
        if(item.lien_ressource) badges += `<a href="${item.lien_ressource}" target="_blank" class="badge badge-link" onclick="event.stopPropagation()">Ressource</a>`;
        
        const categoriesCarnet = ["Licks", "Patterns", "Thèmes", "Standards"];
        if (categoriesCarnet.includes(item.categorie)) {
            const filterCat = item.categorie;
            badges += `<button class="badge-carnet" onclick="ouvrirModalCarnet('${filterCat}', event)">
                <svg viewBox="0 0 24 24" style="width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 4px;"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg> Carnet
            </button>`;
        }
        badges += `</div>`;

        let chronoAffiche = item.fait ? 'Terminé' : `${item.temps_prevu} min`;
        div.innerHTML = `
            <div class="item-header">
                <div style="display: flex; align-items: center;">
                    <span class="drag-handle" title="Réorganiser" onclick="event.stopPropagation()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></span>
                    <span class="categorie">${item.categorie}</span>
                </div>
                <span class="badge-temps" id="timer-display-${index}">${chronoAffiche}</span>
            </div>
            <div class="contenu">${item.contenu}</div>${badges}
        `;
        conteneur.appendChild(div);
    });

    const btnTerminer = document.getElementById('btn-terminer');
    document.getElementById('fin-seance-container').style.display = 'flex'; btnTerminer.style.display = 'inline-flex';
    document.getElementById('fin-seance-actions').style.display = 'none';
    btnTerminer.className = "btn-action btn-ghost-neutral";
    btnTerminer.innerHTML = `${svgTick} Terminer la séance`;
    btnTerminer.onclick = demanderFinSeance; verifierFinSeance();
}

function jouerSonFinChrono() {
    initAudio(); const now = audioContext.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1); gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.5);
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 1.5);
    });
}

function jouerSonApparitionPause() {
    initAudio(); const now = audioContext.currentTime;
    [587.33, 783.99].forEach((freq, i) => {
        const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
        osc.start(startTime); osc.stop(startTime + 1.0);
    });
}

function jouerSonFinPause() {
    initAudio(); const now = audioContext.currentTime;
    [783.99, 659.25, 523.25].forEach((freq, i) => {
        const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.type = 'sine'; osc.frequency.value = freq;
        const startTime = now + i * 0.15;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
        osc.start(startTime); osc.stop(startTime + 1.5);
    });
}

function toggleMetronome(tempo, event, btnElement) {
    event.stopPropagation(); initAudio();
    if (metronome.isPlaying && metronome.currentBtn === btnElement) { stopMetronome(); } 
    else {
        if (metronome.isPlaying) stopMetronome(); 
        metronome.tempo = tempo; metronome.isPlaying = true; metronome.currentBtn = btnElement; 
        btnElement.classList.add('playing'); btnElement.innerHTML = `${svgMetronomeActive} Stop`;
        metronome.nextNoteTime = audioContext.currentTime + 0.1; scheduler();
    }
}

function stopMetronome() {
    metronome.isPlaying = false; clearTimeout(metronome.timerWorker);
    if (metronome.currentBtn) { metronome.currentBtn.classList.remove('playing'); metronome.currentBtn.innerHTML = `${svgMetronome} ${metronome.tempo} bpm`; }
    metronome.currentBtn = null;
}

function scheduler() {
    while (metronome.nextNoteTime < audioContext.currentTime + 0.1) {
        jouerClicMetronome(metronome.nextNoteTime); metronome.nextNoteTime += (60.0 / metronome.tempo);
    }
    if (metronome.isPlaying) metronome.timerWorker = setTimeout(scheduler, 25);
}

function jouerClicMetronome(time) {
    const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
    osc.connect(gain); gain.connect(audioContext.destination); osc.frequency.value = 800; 
    gain.gain.setValueAtTime(0.5, time); gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time); osc.stop(time + 0.05);
}

// --- LOGIQUE POMODORO (CHRONO GLOBAL & PAUSE CAFÉ) ---

function startGlobalTimer() {
    if (globalTimerData.isRunning) return;
    if (activeTimer.index === null || activeTimer.isPaused) return; 
    
    globalTimerData.isRunning = true;
    globalTimerData.endTime = Date.now() + (globalTimerData.remaining * 1000);
    globalTimerData.interval = setInterval(checkGlobalTimer, 1000);
}

function checkGlobalTimer() {
    let left = Math.ceil((globalTimerData.endTime - Date.now()) / 1000);
    if (left <= 0) {
        clearInterval(globalTimerData.interval);
        globalTimerData.isRunning = false;
        globalTimerData.isBreakPending = true;
        showBreakButton();
    } else {
        globalTimerData.remaining = left;
    }
}

function pauseGlobalTimer() {
    if (globalTimerData.isRunning) {
        clearInterval(globalTimerData.interval);
        globalTimerData.isRunning = false;
    }
}

function showBreakButton() {
    const btn = document.getElementById('btn-pause-cafe');
    const txt = document.getElementById('texte-pause-cafe');
    
    btn.style.display = 'inline-flex';
    btn.classList.remove('btn-fade-out');
    
    btn.className = 'btn-action btn-ghost-blue btn-square'; 
    btn.title = "Petite pause ?";
    txt.style.display = 'none';
    jouerSonApparitionPause();
}

function demarrerPauseCafe() {
    const btn = document.getElementById('btn-pause-cafe');
    const txt = document.getElementById('texte-pause-cafe');

    if (breakTimerData.interval !== null) {
        clearInterval(breakTimerData.interval);
        breakTimerData.interval = null;
        terminerPauseCafe(true); 
        return;
    }

    if (activeTimer.index !== null && !activeTimer.isPaused) {
        togglePause();
    }
    
    btn.className = 'btn-action btn-ghost-yellow';
    btn.title = "Annuler la pause";
    
    txt.style.display = 'inline-block'; 
    
    breakTimerData.endTime = Date.now() + (POMODORO_BREAK_SEC * 1000);
    breakTimerData.interval = setInterval(updateBreakTimer, 1000);
    updateBreakTimer(); 
}

function updateBreakTimer() {
    if (!breakTimerData.interval) return;
    
    let left = Math.ceil((breakTimerData.endTime - Date.now()) / 1000);
    
    if (left <= 0) {
        clearInterval(breakTimerData.interval);
        breakTimerData.interval = null;
        terminerPauseCafe(false);
        return;
    }
    
    const txt = document.getElementById('texte-pause-cafe');
    if (txt) {
        txt.textContent = formaterTemps(left);
    }
}

function terminerPauseCafe(estAnnulee = false) {
    if (!estAnnulee) jouerSonFinPause();
    const btn = document.getElementById('btn-pause-cafe');
    btn.classList.add('btn-fade-out'); 
    
    setTimeout(() => {
        btn.style.display = 'none';
        globalTimerData.isBreakPending = false;
        globalTimerData.remaining = POMODORO_WORK_SEC; 
    }, 500);
}

// --- LOGIQUE CHRONO PRINCIPALE ROBUSTE ---

function togglePause() {
    if (activeTimer.index === null) return;
    const btnPause = document.getElementById('btn-pause-global');
    if (activeTimer.isPaused) {
        activeTimer.isPaused = false; 
        btnPause.innerHTML = svgPauseSquare; 
        btnPause.className = 'btn-action btn-ghost-blue btn-square';
        const now = Date.now();
        if (!activeTimer.isOvertime) activeTimer.endTime = now + (activeTimer.remainingSecsAtPause * 1000);
        else activeTimer.overtimeStartTime = now - (activeTimer.remainingSecsAtPause * 1000);
        demarrerBoucleChrono();
    } else {
        activeTimer.isPaused = true; 
        clearInterval(activeTimer.interval);
        btnPause.innerHTML = svgPlaySquare; 
        btnPause.className = 'btn-action btn-ghost-yellow btn-square';
        majAffichageChrono(activeTimer.index, activeTimer.remainingSecsAtPause);
        pauseGlobalTimer(); 
    }
}

function demarrerBoucleChrono() {
    if (activeTimer.interval) clearInterval(activeTimer.interval);
    
    try {
        if (!globalTimerData.isRunning && !globalTimerData.isBreakPending && !breakTimerData.interval) {
            startGlobalTimer();
        }
    } catch (e) { console.error("Erreur startGlobalTimer:", e); }

    const tick = () => {
        if (activeTimer.index === null || activeTimer.isPaused) return; 
        const now = Date.now(); let displaySecs = 0;
        if (!activeTimer.isOvertime) {
            displaySecs = Math.ceil((activeTimer.endTime - now) / 1000);
            if (displaySecs <= 0) { 
                activeTimer.isOvertime = true; 
                activeTimer.overtimeStartTime = now; 
                displaySecs = 0; 
                jouerSonFinChrono(); 
            }
        } else { 
            displaySecs = Math.floor((now - activeTimer.overtimeStartTime) / 1000); 
        }
        activeTimer.remainingSecsAtPause = displaySecs; 
        majAffichageChrono(activeTimer.index, displaySecs);
        
        sessionRealTime++;
        if (sessionRealTime % 5 === 0 && seanceEnCours) {
            localStorage.setItem('session_time_' + seanceEnCours.id, sessionRealTime);
        }
    };

    tick(); // Appel immédiat
    activeTimer.interval = setInterval(tick, 1000);
}

async function gererClicCarte(index) {
    const item = seanceEnCours.items[index];
    initAudio(); const btnPause = document.getElementById('btn-pause-global');

    // 1. ANNULER UN EXERCICE TERMINÉ (UNDO)
    if (item.fait) {
        item.fait = false;
        let remaining = item.temps_restant !== undefined ? item.temps_restant : (Number(item.temps_prevu) * 60);

        const card = document.getElementById(`card-${index}`);
        const display = document.getElementById(`timer-display-${index}`);
        card.classList.remove('done');

        try { await fetch(`${API_URL}/seances/${seanceEnCours.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seanceEnCours) }); } 
        catch (erreur) { console.error("Erreur sauvegarde", erreur); }
        verifierFinSeance();

        // Relancer le chrono s'il restait du temps, s'il n'avait pas commencé, ou s'il était en overtime
        if (remaining > 0 || item.isOvertime) {
            if (activeTimer.index !== null) {
                const prevIdx = activeTimer.index; clearInterval(activeTimer.interval);
                seanceEnCours.items[prevIdx].temps_restant = activeTimer.remainingSecsAtPause;
                seanceEnCours.items[prevIdx].isOvertime = activeTimer.isOvertime;
                const prevCard = document.getElementById(`card-${prevIdx}`);
                if(prevCard) {
                    prevCard.classList.remove('active');
                    const prevDisplay = document.getElementById(`timer-display-${prevIdx}`);
                    prevDisplay.className = 'badge-temps paused';
                    prevDisplay.textContent = formaterTemps(activeTimer.remainingSecsAtPause);
                }
            }
            activeTimer.index = index; activeTimer.isPaused = false;
            activeTimer.remainingSecsAtPause = remaining;

            if (item.isOvertime) {
                activeTimer.isOvertime = true;
                activeTimer.overtimeStartTime = Date.now() - (remaining * 1000);
                activeTimer.endTime = null;
            } else {
                activeTimer.isOvertime = false;
                activeTimer.endTime = Date.now() + (remaining * 1000);
            }

            btnPause.disabled = false; btnPause.innerHTML = svgPauseSquare; btnPause.className = 'btn-action btn-ghost-blue btn-square';
            card.classList.add('active');
            majAffichageChrono(index, remaining);
            demarrerBoucleChrono();
        } else {
            display.textContent = formaterTemps(0);
            display.className = 'badge-temps paused';
        }
        return; 
    }

    // 2. TERMINER L'EXERCICE ACTIF
    if (activeTimer.index === index) {
        clearInterval(activeTimer.interval); 
        item.temps_restant = activeTimer.remainingSecsAtPause; 
        item.isOvertime = activeTimer.isOvertime; // Garde en mémoire l'état d'overtime
        activeTimer.index = null; activeTimer.isPaused = false; item.fait = true;
        btnPause.disabled = true; btnPause.innerHTML = svgPauseSquare; btnPause.className = 'btn-action btn-ghost-neutral btn-square';
        pauseGlobalTimer(); 
        
        const card = document.getElementById(`card-${index}`); const display = document.getElementById(`timer-display-${index}`);
        card.classList.remove('active'); card.classList.add('done');
        display.classList.remove('overtime', 'running', 'paused'); display.textContent = 'Terminé';
        
        try { await fetch(`${API_URL}/seances/${seanceEnCours.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seanceEnCours) }); } 
        catch (erreur) { console.error("Erreur sauvegarde", erreur); }
        verifierFinSeance();
    } 
    // 3. DÉMARRER OU CHANGER D'EXERCICE
    else {
        if (activeTimer.index !== null) {
            const prevIdx = activeTimer.index; clearInterval(activeTimer.interval);
            seanceEnCours.items[prevIdx].temps_restant = activeTimer.remainingSecsAtPause;
            seanceEnCours.items[prevIdx].isOvertime = activeTimer.isOvertime;
            const prevCard = document.getElementById(`card-${prevIdx}`);
            if(prevCard) {
                prevCard.classList.remove('active');
                const prevDisplay = document.getElementById(`timer-display-${prevIdx}`);
                prevDisplay.className = 'badge-temps paused';
                prevDisplay.textContent = formaterTemps(activeTimer.remainingSecsAtPause);
            }
        }
        activeTimer.index = index; activeTimer.isPaused = false;
        
        let remaining = item.temps_restant !== undefined ? item.temps_restant : (Number(item.temps_prevu) * 60);
        activeTimer.remainingSecsAtPause = remaining;
        
        if (item.isOvertime) {
            activeTimer.isOvertime = true;
            activeTimer.overtimeStartTime = Date.now() - (remaining * 1000);
            activeTimer.endTime = null;
        } else {
            activeTimer.isOvertime = false;
            activeTimer.endTime = Date.now() + (remaining * 1000);
        }
        
        btnPause.disabled = false; btnPause.innerHTML = svgPauseSquare; btnPause.className = 'btn-action btn-ghost-blue btn-square';
        document.getElementById(`card-${index}`).classList.add('active');
        majAffichageChrono(index, activeTimer.remainingSecsAtPause); 
        demarrerBoucleChrono();
    }
}


function formaterTemps(secondes) {
    const min = Math.floor(secondes / 60);
    const sec = secondes % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function majAffichageChrono(index, secondesAffichees) {
    const display = document.getElementById(`timer-display-${index}`);
    if(!display) { console.log("Timer introuvable pour l'index :", index); return; }
    
    const tFormate = formaterTemps(secondesAffichees);
    if (activeTimer.isPaused) {
        display.classList.remove('running', 'overtime'); display.classList.add('paused'); display.innerHTML = `En pause (${tFormate})`;
    } else if (activeTimer.isOvertime) {
        display.classList.remove('running', 'paused'); display.classList.add('overtime'); display.innerHTML = `+ ${tFormate}`;
    } else {
        display.classList.add('running'); display.classList.remove('paused', 'overtime'); display.innerHTML = `${tFormate}`; 
    }
}

function verifierFinSeance() {
    if (!seanceEnCours || !seanceEnCours.items) return;
    const btn = document.getElementById('btn-terminer'); if (btn.classList.contains('done')) return; 
    const toutFini = seanceEnCours.items.every(item => item.fait);
    if (toutFini && seanceEnCours.items.length > 0) { btn.classList.add('btn-glow-success'); btn.classList.remove('btn-ghost-neutral'); btn.classList.add('btn-ghost-green'); } 
    else { btn.classList.remove('btn-glow-success'); btn.classList.remove('btn-ghost-green'); btn.classList.add('btn-ghost-neutral'); }
}

function demanderFinSeance() {
    if (activeTimer.interval) {
        clearInterval(activeTimer.interval); activeTimer.isPaused = true;
        const btnPause = document.getElementById('btn-pause-global');
        if(btnPause) { btnPause.innerHTML = svgPlaySquare; btnPause.className = 'btn-action btn-ghost-yellow btn-square'; }
        majAffichageChrono(activeTimer.index, activeTimer.remainingSecsAtPause);
        pauseGlobalTimer();
    }
    stopMetronome();
    document.getElementById('btn-terminer').style.display = 'none'; document.getElementById('fin-seance-actions').style.display = 'flex';
}

async function sauvegarderStats() {
    if(!seanceEnCours) return;
    try { 
        await fetch(`${API_URL}/seances/${seanceEnCours.id}/terminer?duree=${sessionRealTime}`, { method: 'POST' }); 
        localStorage.removeItem('session_time_' + seanceEnCours.id);
        terminerEtReinitialiser('sauvegardee'); 
    } 
    catch(erreur) { console.error("Erreur d'enregistrement :", erreur); terminerEtReinitialiser('sauvegardee'); }
}

function ignorerStats() { 
    if(seanceEnCours) localStorage.removeItem('session_time_' + seanceEnCours.id);
    terminerEtReinitialiser('ignoree'); 
}

function terminerEtReinitialiser(statut) {
    if (globalTimerData.interval) { clearInterval(globalTimerData.interval); globalTimerData.interval = null; }
    globalTimerData.isRunning = false; globalTimerData.isBreakPending = false;
    
    if (breakTimerData.interval) { clearInterval(breakTimerData.interval); breakTimerData.interval = null; }
    
    const btnCafe = document.getElementById('btn-pause-cafe');
    if (btnCafe) btnCafe.style.display = 'none';

    document.getElementById('fin-seance-actions').style.display = 'none';
    const btn = document.getElementById('btn-terminer'); btn.style.display = 'inline-flex'; btn.className = "btn-action done"; btn.onclick = null; 
    btn.innerHTML = statut === 'sauvegardee' ? `${svgSaveCheck} Séance terminée et sauvegardée` : `${svgTick} Séance terminée`;
    seanceEnCours = null; licksPratiquesSession.clear(); setTimeout(() => { afficherVue('historique'); }, 1500);
}

function changerTemps(delta) {
    let input = document.getElementById('input-temps'); let val = parseInt(input.value);
    if(isNaN(val)) val = 25; 
    val = delta > 0 ? Math.ceil((val + 0.1) / 5) * 5 : Math.floor((val - 0.1) / 5) * 5;
    if (val < 1) val = 1; input.value = val;
}
function changerTempo(delta) {
    let input = document.getElementById('input-tempo'); let val = parseInt(input.value);
    if(isNaN(val)) val = 100; 
    val += delta; if(val < 20) val = 20; input.value = val;
}

function gererAffichageOptions() {
    const categorie = document.getElementById('input-categorie').value;
    document.getElementById('options-gammes').style.display = (categorie === "Gammes") ? "flex" : "none";
    document.getElementById('container-autre').style.display = (categorie === "Autre...") ? "block" : "none";
}

function genererTonaliteAleatoire() {
    const notes = ["C", "D♭", "D", "E♭", "E", "F", "F#", "G", "A♭", "A", "B♭", "B"];
    document.getElementById('input-ton-note').value = notes[Math.floor(Math.random() * notes.length)];
    document.getElementById('input-ton-mode').value = ["majeur", "mineur"][Math.floor(Math.random() * 2)];
}

function ajouterItemBrouillon() {
    let cat = document.getElementById('input-categorie').value; if (cat === "Autre...") cat = document.getElementById('input-categorie-autre').value || "Autre";
    let tempsVal = parseInt(document.getElementById('input-temps').value); if (isNaN(tempsVal) || tempsVal < 1) tempsVal = 25; 
    const tempoInput = document.getElementById('input-tempo').value;
    const item = {
        categorie: cat, contenu: document.getElementById('input-contenu').value || "Travail libre", temps_prevu: tempsVal,
        tempo: tempoInput ? parseInt(tempoInput) : null, lien_ressource: document.getElementById('input-lien').value || null,
        fait: false, ordre: itemsBrouillon.length
    };
    if (cat === "Gammes") { item.type_gamme = document.getElementById('input-type-gamme').value; item.mains = document.getElementById('input-mains').value; }
    
    if (editDraftIndex !== null) {
        itemsBrouillon[editDraftIndex] = item;
        editDraftIndex = null;
        const btn = document.getElementById('btn-add-draft');
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 8px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Ajouter à la séance`;
        btn.className = 'btn-action btn-ghost-green';
    } else {
        itemsBrouillon.push(item); 
    }
    
    afficherBrouillon();
    document.getElementById('input-contenu').value = ""; document.getElementById('input-tempo').value = ""; 
}

function editerBrouillon(index) {
    editDraftIndex = index;
    const item = itemsBrouillon[index];
    
    document.getElementById('input-categorie').value = item.categorie;
    if (!document.querySelector(`#input-categorie option[value="${item.categorie}"]`)) {
        document.getElementById('input-categorie').value = "Autre...";
        document.getElementById('input-categorie-autre').value = item.categorie;
    }
    
    document.getElementById('input-temps').value = item.temps_prevu;
    document.getElementById('input-contenu').value = item.contenu === "Travail libre" ? "" : item.contenu;
    document.getElementById('input-tempo').value = item.tempo || "";
    document.getElementById('input-lien').value = item.lien_ressource || "";
    if (item.type_gamme) document.getElementById('input-type-gamme').value = item.type_gamme;
    if (item.mains) document.getElementById('input-mains').value = item.mains;
    
    gererAffichageOptions();
    
    const btn = document.getElementById('btn-add-draft');
    btn.innerHTML = `${svgPencil} Modifier l'exercice`;
    btn.className = 'btn-action btn-ghost-blue';
    document.getElementById('vue-creation').scrollIntoView({behavior: 'smooth'});
}

function afficherBrouillon() {
    const liste = document.getElementById('liste-brouillon'); liste.innerHTML = "";
    let totalMins = itemsBrouillon.reduce((sum, item) => sum + Number(item.temps_prevu), 0);
    const badgeTime = document.getElementById('total-time-badge');
    if(badgeTime) badgeTime.textContent = Math.floor(totalMins / 60) + "h" + (totalMins % 60).toString().padStart(2, '0');

    const btnSaveRoutine = document.getElementById('btn-save-routine');
    if (btnSaveRoutine) {
        btnSaveRoutine.disabled = itemsBrouillon.length === 0;
    }

    itemsBrouillon.forEach((item, index) => {
        liste.innerHTML += `
            <div class="item-draft">
                <div style="display: flex; align-items: center; flex-grow: 1;">
                    <span class="drag-handle" title="Réorganiser"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></span>
                    <div>
                        <span style="font-weight:600; color:#c9d1d9;">${item.categorie}</span> 
                        <span style="color:#8b949e;">(${item.temps_prevu} min)</span><br> 
                        <span style="font-size:14px; color:#c9d1d9;">${item.contenu}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn-action btn-ghost-blue btn-square" onclick="editerBrouillon(${index})" title="Modifier">
                        ${svgPencil}
                    </button>
                    <button class="btn-action btn-ghost-red btn-square" onclick="supprimerBrouillon(${index})" title="Supprimer">
                        ${svgTrash}
                    </button>
                </div>
            </div>`;
    });
}

function supprimerBrouillon(index) { 
    if(editDraftIndex === index) {
        editDraftIndex = null;
        const btn = document.getElementById('btn-add-draft');
        btn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 8px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Ajouter à la séance`;
        btn.className = 'btn-action btn-ghost-green';
    }
    itemsBrouillon.splice(index, 1); 
    afficherBrouillon(); 
}

async function sauvegarderSeance() {
    if(itemsBrouillon.length === 0) return; 
    const note = document.getElementById('input-ton-note').value; const mode = document.getElementById('input-ton-mode').value;
    const nouvelleSeance = { date_seance: new Date().toISOString().split('T')[0], tonalite_du_jour: note + " " + mode, items: itemsBrouillon };
    try {
        const reponse = await fetch(`${API_URL}/seances`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nouvelleSeance) });
        if (reponse.ok) { await chargerDerniereSeance(); afficherVue('pratique'); }
    } catch (erreur) { console.error(erreur); }
}

function initDragAndDrop() {
    sortableBrouillon = new Sortable(document.getElementById('liste-brouillon'), {
        handle: '.drag-handle', animation: 150, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
        onEnd: function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            itemsBrouillon.splice(evt.newIndex, 0, itemsBrouillon.splice(evt.oldIndex, 1)[0]);
            itemsBrouillon.forEach((item, idx) => item.ordre = idx); afficherBrouillon();
        }
    });

    sortablePratique = new Sortable(document.getElementById('conteneur-items'), {
        handle: '.drag-handle', animation: 150, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag',
        onEnd: async function (evt) {
            if (evt.oldIndex === evt.newIndex) return;
            seanceEnCours.items.splice(evt.newIndex, 0, seanceEnCours.items.splice(evt.oldIndex, 1)[0]);
            seanceEnCours.items.forEach((item, idx) => item.ordre = idx);

            if (activeTimer.index === evt.oldIndex) activeTimer.index = evt.newIndex;
            else if (activeTimer.index !== null) {
                if (evt.oldIndex < activeTimer.index && evt.newIndex >= activeTimer.index) activeTimer.index--;
                else if (evt.oldIndex > activeTimer.index && evt.newIndex <= activeTimer.index) activeTimer.index++;
            }
            Array.from(document.getElementById('conteneur-items').children).forEach((card, idx) => {
                card.id = `card-${idx}`; card.onclick = () => gererClicCarte(idx);
                const timerDisplay = card.querySelector('.badge-temps'); if(timerDisplay) timerDisplay.id = `timer-display-${idx}`;
            });
            try { await fetch(`${API_URL}/seances/${seanceEnCours.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seanceEnCours) }); } 
            catch (erreur) { console.error("Erreur sauvegarde D&D", erreur); }
            verifierFinSeance();
        }
    });
}

// --- HISTORIQUE, STATS & GRAPHIQUES ---
let historiquesTerminees = [];
let graphTypeActuel = '';
let graphPeriodeActuelle = 'semaine';
let monGraphique = null;

function getMonday(d) {
    d = new Date(d);
    let day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

async function chargerHistorique() {
    try {
        const reponse = await fetch(`${API_URL}/seances`); 
        const seances = await reponse.json();
        historiquesTerminees = seances.filter(s => s.statut === 'terminee');
        
        const listeHist = document.getElementById('liste-historique-seances'); 
        listeHist.innerHTML = "";

        if (historiquesTerminees.length === 0) {
            listeHist.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Aucune séance terminée pour le moment.</div>`;
            document.getElementById('stat-temps-7j').textContent = "-- min";
            document.getElementById('stat-completion').textContent = "-- %";
            document.getElementById('stat-streak').querySelector('span').textContent = "--";
            document.getElementById('stat-tonalite-reine').querySelector('span').textContent = "--"; 
            return;
        }

        let tempsTotalMins = 0; 
        let tempsTotalSemaineMins = 0;
        let tonsCount = {}; 
        let itemsFaits = 0;
        let itemsTotal = 0;

        const lundiCetteSemaine = getMonday(new Date());
        lundiCetteSemaine.setHours(0,0,0,0);

        let datesSet = new Set(historiquesTerminees.map(s => s.date_seance));
        let streak = 0;
        let d = new Date();
        let dateStr = d.toISOString().split('T')[0];
        
        if (!datesSet.has(dateStr)) {
            d.setDate(d.getDate() - 1);
            dateStr = d.toISOString().split('T')[0];
        }
        while(datesSet.has(dateStr)) {
            streak++;
            d.setDate(d.getDate() - 1);
            dateStr = d.toISOString().split('T')[0];
        }

        historiquesTerminees.forEach(s => {
            if(s.tonalite_du_jour) tonsCount[s.tonalite_du_jour] = (tonsCount[s.tonalite_du_jour] || 0) + 1;
            
            let tempsSeanceMins = 0; 
            
            if (s.duree_reelle && s.duree_reelle > 0) {
                tempsSeanceMins = Math.round(s.duree_reelle / 60);
            } else {
                s.items.forEach(item => { if(item.fait) tempsSeanceMins += Number(item.temps_prevu); });
            }
            tempsTotalMins += tempsSeanceMins;
            s.tempsTotalCalc = tempsSeanceMins;
            
            const dateSeance = new Date(s.date_seance);
            if (dateSeance >= lundiCetteSemaine) {
                tempsTotalSemaineMins += tempsSeanceMins;
            }

            if (s.items && Array.isArray(s.items)) {
                s.items.forEach(item => {
                    itemsTotal++;
                    if(item.fait) itemsFaits++;
                });
            }
        });

        renderHistoriqueListe();

        
        let completionRate = itemsTotal === 0 ? 0 : Math.round((itemsFaits / itemsTotal) * 100);

        document.getElementById('stat-temps-7j').textContent = formatDureeHistorique(tempsTotalSemaineMins);
        document.getElementById('stat-completion').textContent = completionRate + " %";
        document.getElementById('stat-streak').querySelector('span').textContent = streak + " j";

        let reine = "--"; let maxCount = 0;
        for (const [ton, count] of Object.entries(tonsCount)) { if (count > maxCount) { maxCount = count; reine = ton; } }
        document.getElementById('stat-tonalite-reine').querySelector('span').textContent = formatTonalite(reine);

    } catch(err) { document.getElementById('liste-historique-seances').innerHTML = `<div style="text-align: center; color: var(--accent-red);">Erreur lors du chargement.</div>`; }
}

async function supprimerSeance(id) {
    if(!confirm("Supprimer cette séance de l'historique ?")) return;
    try {
        await fetch(`${API_URL}/seances/${id}`, { method: 'DELETE' });
        chargerHistorique();
    } catch(e) { console.error(e); }
}

async function reinitialiserHistorique() {
    if(confirm("Veux-tu vraiment effacer tout l'historique ? Cette action est définitive.")) {
        try { if((await fetch(`${API_URL}/seances/reset`, { method: 'DELETE' })).ok) chargerHistorique(); } catch(e) { console.error(e); }
    }
}

function ouvrirModalGraph(type, event) {
    if (event) event.stopPropagation();
    graphTypeActuel = type;
    
    if (type === 'tonalites') {
        document.getElementById('dd-type-graph').style.display = 'none';
    } else {
        document.getElementById('dd-type-graph').style.display = 'inline-block';
        document.getElementById('label-type-graph').innerText = type === 'temps' ? 'Temps passé' : 'Répartition';
        document.querySelectorAll('#dd-type-graph .dropdown-content button').forEach(b => b.classList.remove('active'));
        document.getElementById(`filter-type-${type}`).classList.add('active');
    }
    
    document.getElementById('modal-graph').style.display = 'flex';
    changerPeriodeGraph('semaine'); 
}

function changerTypeGraph(type) {
    graphTypeActuel = type;
    document.getElementById('label-type-graph').innerText = type === 'temps' ? 'Temps passé' : 'Répartition';
    document.querySelectorAll('#dd-type-graph .dropdown-content button').forEach(b => b.classList.remove('active'));
    document.getElementById(`filter-type-${type}`).classList.add('active');
    changerPeriodeGraph(graphPeriodeActuelle); 
}

function changerPeriodeGraph(periode) {
    graphPeriodeActuelle = periode;
    
    const labelsUI = { 'semaine': 'Cette semaine', 'mois': 'Ce mois', 'annee': 'Cette année', 'total': 'Total' };
    document.getElementById('label-periode-graph').innerText = labelsUI[periode];
    document.querySelectorAll('#dd-periode-graph .dropdown-content button').forEach(b => b.classList.remove('active'));
    document.getElementById(`filter-graph-${periode}`).classList.add('active');

    const now = new Date();
    let startDate = new Date(0);
    let labelsData = [];
    let dataMap = {}; 
    let totalMinutes = 0;

    if (periode === 'semaine') {
        startDate = getMonday(now);
        startDate.setHours(0,0,0,0);
        labelsData = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
        labelsData.forEach(l => dataMap[l] = 0);
    } else if (periode === 'mois') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        labelsData = ["Semaine 1", "Semaine 2", "Semaine 3", "Semaine 4", "Semaine 5"];
        labelsData.forEach(l => dataMap[l] = 0);
    } else if (periode === 'annee') {
        startDate = new Date(now.getFullYear(), 0, 1);
        labelsData = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        labelsData.forEach(l => dataMap[l] = 0);
    }

    let statsCategories = {};
    let statsTonalites = {};

    historiquesTerminees.forEach(s => {
        const dateSeance = new Date(s.date_seance);
        if (dateSeance >= startDate) {
            let tempsSeanceMins = s.duree_reelle && s.duree_reelle > 0 ? Math.round(s.duree_reelle / 60) : 0;
            let tempsPrevuTotal = 0;
            
            if (s.items && Array.isArray(s.items)) {
                s.items.forEach(item => { if(item.fait) tempsPrevuTotal += Number(item.temps_prevu || 0); });
                if (tempsSeanceMins === 0) tempsSeanceMins = tempsPrevuTotal; 
                
                let ratio = (s.duree_reelle && s.duree_reelle > 0 && tempsPrevuTotal > 0) ? (tempsSeanceMins / tempsPrevuTotal) : 1;
                
                s.items.forEach(item => {
                    if(item.fait) {
                        const t = Number(item.temps_prevu || 0) * ratio; 
                        statsCategories[item.categorie] = (statsCategories[item.categorie] || 0) + t;
                    }
                });
            }

            totalMinutes += tempsSeanceMins;

            if (graphTypeActuel === 'temps') {
                if (periode === 'semaine') {
                    let d = dateSeance.getDay();
                    let idx = d === 0 ? 6 : d - 1;
                    dataMap[labelsData[idx]] += tempsSeanceMins;
                } else if (periode === 'mois') {
                    let dateNum = dateSeance.getDate();
                    let weekIdx = Math.floor((dateNum - 1) / 7);
                    if(weekIdx > 4) weekIdx = 4;
                    dataMap[labelsData[weekIdx]] += tempsSeanceMins;
                } else if (periode === 'annee') {
                    let m = dateSeance.getMonth();
                    dataMap[labelsData[m]] += tempsSeanceMins;
                } else {
                    let yr = dateSeance.getFullYear().toString();
                    if(!labelsData.includes(yr)) { labelsData.push(yr); dataMap[yr] = 0; }
                    dataMap[yr] += tempsSeanceMins;
                }
            }

            if(s.tonalite_du_jour) {
                statsTonalites[s.tonalite_du_jour] = (statsTonalites[s.tonalite_du_jour] || 0) + 1;
            }
        }
    });

    let heuresFormattees = (totalMinutes / 60).toFixed(1);
    document.getElementById('total-temps-graph').innerText = 'Total : ' + heuresFormattees + ' h';

    if (monGraphique) monGraphique.destroy(); 
    const ctx = document.getElementById('myChart').getContext('2d');
    const titre = document.getElementById('titre-graph');
    
    const colorsPalette = ['#58a6ff', '#2ea043', '#d29922', '#f85149', '#bc8cff', '#8b949e', '#e3b341', '#3fb950'];

    if (graphTypeActuel === 'temps') {
        titre.textContent = "Temps passé";
        if (totalMinutes === 0) {
            monGraphique = new Chart(ctx, {
                type: 'bar',
                data: { labels: ["Aucune donnée"], datasets: [{ label: 'Heures', data: [0], backgroundColor: '#30363d', borderRadius: 4 }] },
                options: { responsive: true, color: '#c9d1d9', scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false } } }
            });
        } else {
            monGraphique = new Chart(ctx, {
                type: 'bar',
                data: { labels: labelsData, datasets: [{ label: 'Heures', data: labelsData.map(l => parseFloat((dataMap[l] / 60).toFixed(1))), backgroundColor: '#58a6ff', borderRadius: 4, maxBarThickness: 40 }] },
                options: { responsive: true, color: '#c9d1d9', scales: { y: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } }, x: { grid: { display: false }, ticks: { color: '#8b949e' } } }, plugins: { legend: { display: false } } }
            });
        }
    } else if (graphTypeActuel === 'categories') {
        titre.textContent = "Répartition du temps";
        if (Object.keys(statsCategories).length === 0) {
            monGraphique = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ["Aucune donnée"], datasets: [{ data: [1], backgroundColor: ['#30363d'], borderColor: '#161b22', borderWidth: 2 }] },
                options: { responsive: true, color: '#c9d1d9', plugins: { tooltip: {enabled: false}, legend: { display: false } } }
            });
        } else {
            monGraphique = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: Object.keys(statsCategories), datasets: [{ data: Object.values(statsCategories), backgroundColor: colorsPalette, borderColor: '#161b22', borderWidth: 2 }] },
                options: { responsive: true, color: '#c9d1d9', plugins: { legend: { labels: { color: '#c9d1d9' } } } }
            });
        }
    } else if (graphTypeActuel === 'tonalites') {
        titre.textContent = "Séances par tonalité";
        if (Object.keys(statsTonalites).length === 0) {
            monGraphique = new Chart(ctx, {
                type: 'bar',
                data: { labels: ["Aucune donnée"], datasets: [{ label: 'Nombre de séances', data: [0], backgroundColor: '#30363d', borderRadius: 4, maxBarThickness: 40 }] },
                options: { responsive: true, color: '#c9d1d9', scales: { y: { ticks: { stepSize: 1, color: '#8b949e' }, grid: { color: '#30363d' } }, x: { ticks: { color: '#8b949e' }, grid: { display: false } } }, plugins: { legend: { display: false } } }
            });
        } else {
            const bgColors = Object.keys(statsTonalites).map((_, i) => colorsPalette[i % colorsPalette.length]);
            monGraphique = new Chart(ctx, {
                type: 'bar',
                data: { labels: Object.keys(statsTonalites), datasets: [{ label: 'Nombre de séances', data: Object.values(statsTonalites), backgroundColor: bgColors, borderRadius: 4, maxBarThickness: 40 }] },
                options: { responsive: true, color: '#c9d1d9', scales: { y: { ticks: { stepSize: 1, color: '#8b949e' }, grid: { color: '#30363d' } }, x: { ticks: { color: '#8b949e' }, grid: { display: false } } }, plugins: { legend: { display: false } } }
            });
        }
    }
}

function fermerModal() { document.getElementById('modal-graph').style.display = 'none'; }

// --- VOCABULAIRE ET BIBLIOTHÈQUE ---

window.onclick = function(event) {
    if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show'));
    }
    if (event.target.classList.contains('modal')) {
        fermerModal(); 
        fermerModalCarnet(); 
        fermerModalImage();
        fermerModalRoutines();
        fermerModalSaveRoutine();
    }
}

function toggleDropdown(id, event) {
    event.stopPropagation();
    document.querySelectorAll('.dropdown').forEach(d => { if(d.id !== id) d.classList.remove('show') });
    document.getElementById(id).classList.toggle('show');
}

function rechercherBiblio(val) {
    searchQueryBiblio = val.trim().toLowerCase();
    renderBibliotheque();
}

function rechercherCarnet(val) {
    searchQueryCarnet = val.trim().toLowerCase();
    renderCarnet();
}

function toggleFilterFav(context) {
    if (context === 'biblio') {
        showFavBiblio = !showFavBiblio;
        const btn = document.getElementById('btn-filter-fav-biblio');
        if(showFavBiblio) {
            btn.classList.replace('btn-ghost-neutral', 'btn-ghost-red');
            btn.innerHTML = svgHeartFilled;
        } else {
            btn.classList.replace('btn-ghost-red', 'btn-ghost-neutral');
            btn.innerHTML = svgHeartOutline;
        }
        renderBibliotheque();
    } else {
        showFavCarnet = !showFavCarnet;
        const btn = document.getElementById('btn-filter-fav-carnet');
        if(showFavCarnet) {
            btn.classList.replace('btn-ghost-neutral', 'btn-ghost-red');
            btn.innerHTML = svgHeartFilled;
        } else {
            btn.classList.replace('btn-ghost-red', 'btn-ghost-neutral');
            btn.innerHTML = svgHeartOutline;
        }
        renderCarnet();
    }
}

async function toggleFavori(id, event) {
    if (event) event.stopPropagation();
    try {
        const res = await fetch(`${API_URL}/vocabulaire/${id}/favori`, { method: 'PUT' });
        const data = await res.json();
        
        const index = vocabulaireCache.findIndex(i => i.id === id);
        if(index !== -1) {
            vocabulaireCache[index].favori = data.favori;
        }
        
        if (document.getElementById('vue-bibliotheque').classList.contains('vue-active')) renderBibliotheque();
        if (document.getElementById('modal-carnet').style.display === 'flex') renderCarnet();
        
    } catch(e) { console.error(e); }
}

function setFilter(context, filterValue, filterLabel) {
    if (context === 'biblio') {
        currentFilterBiblio = filterValue;
        document.getElementById('label-filter-biblio').innerText = filterLabel;
        document.querySelectorAll('#dd-filter-biblio .dropdown-content button').forEach(b => b.classList.remove('active'));
        
        const safeId = filterValue.replace(/[^a-zA-Z0-9]/g, '_');
        document.getElementById(`filter-biblio-${safeId}`).classList.add('active');
        renderBibliotheque();
    } else {
        currentFilterCarnet = filterValue;
        document.getElementById('label-filter-carnet').innerText = filterLabel;
        document.querySelectorAll('#dd-filter-carnet .dropdown-content button').forEach(b => b.classList.remove('active'));
        
        const safeId = filterValue.replace(/[^a-zA-Z0-9]/g, '_');
        const activeBtn = document.getElementById(`filter-carnet-${safeId}`);
        if(activeBtn) activeBtn.classList.add('active');
        renderCarnet();
    }
}

function setSort(context, sortValue) {
    if (context === 'biblio') {
        currentSortBiblio = sortValue;
        document.querySelectorAll('#dd-biblio .dropdown-content button').forEach(b => b.classList.remove('active'));
        document.getElementById(`sort-biblio-${sortValue}`).classList.add('active');
        renderBibliotheque();
    } else {
        currentSortCarnet = sortValue;
        document.querySelectorAll('#dd-carnet .dropdown-content button').forEach(b => b.classList.remove('active'));
        document.getElementById(`sort-carnet-${sortValue}`).classList.add('active');
        renderCarnet();
    }
}

function gererSousCategoriesForm() {
    const type = document.getElementById('input-vocab-type').value;
    const container = document.getElementById('container-vocab-sous-cat');
    const select = document.getElementById('input-vocab-sous-type');

    if (SOUS_CATEGORIES[type]) {
        container.style.display = 'block';
        select.innerHTML = '<option value="">-- Choisir --</option>';
        SOUS_CATEGORIES[type].forEach(sc => { select.innerHTML += `<option value="${sc}">${sc}</option>`; });
    } else {
        container.style.display = 'none';
        select.innerHTML = '';
    }
}

async function ajouterVocabulaire(event) {
    event.preventDefault();
    const btn = document.getElementById('btn-submit-vocab');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = 'Traitement...';

    const formData = new FormData();
    formData.append('nom', document.getElementById('input-vocab-nom').value);
    formData.append('type_item', document.getElementById('input-vocab-type').value);
    
    const sousCat = document.getElementById('input-vocab-sous-type').value;
    if(sousCat) formData.append('sous_categorie', sousCat);

    const fileInput = document.getElementById('input-vocab-image');
    if (fileInput.files.length > 0) formData.append('fichier', fileInput.files[0]);

    try {
        const method = editVocabId ? 'PUT' : 'POST';
        const url = editVocabId ? `${API_URL}/vocabulaire/${editVocabId}` : `${API_URL}/vocabulaire`;
        await fetch(url, { method: method, body: formData });
        
        btn.innerHTML = `${svgSaveCheck} Enregistré`;
        btn.className = 'btn-action done';

        setTimeout(() => {
            annulerEdition();
            chargerVocabulaireApi(); 
        }, 1200);
    } catch (err) { 
        console.error(err);
        btn.disabled = false; btn.innerHTML = originalText;
    } 
}

function trierVocabulaire(items, tri) {
    return items.sort((a, b) => {
        if(tri === "nom_asc") return a.nom.localeCompare(b.nom);
        if(tri === "nom_desc") return b.nom.localeCompare(a.nom);
        if(tri === "prat_desc") return b.nb_pratiques - a.nb_pratiques;
        if(tri === "prat_asc") return a.nb_pratiques - b.nb_pratiques;
        return 0;
    });
}

function genererMediaHtml(item) {
    if (!item.fichier_image) {
        return `<div class="vocab-image-thumb" style="display:flex; align-items:center; justify-content:center; color: var(--text-muted);"><svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></div>`;
    }
    const isPdf = item.fichier_image.toLowerCase().endsWith('.pdf');
    if (isPdf) {
        return `<div class="vocab-image-thumb" style="display:flex; align-items:center; justify-content:center; color: var(--accent-red); background: rgba(248,81,73,0.1);" onclick="window.open('${API_URL}/partitions/${item.fichier_image}', '_blank')" title="Ouvrir le PDF"><svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg></div>`;
    } else {
        return `<img src="${API_URL}/partitions/${item.fichier_image}" class="vocab-image-thumb" onclick="ouvrirModalImage('${API_URL}/partitions/${item.fichier_image}')" title="Clique pour agrandir">`;
    }
}

async function chargerVocabulaireApi() {
    try {
        const res = await fetch(`${API_URL}/vocabulaire`);
        vocabulaireCache = await res.json();
        renderBibliotheque();
    } catch(e) { console.error(e); }
}

function renderBibliotheque() {
    let items = currentFilterBiblio === "Toutes" ? [...vocabulaireCache] : vocabulaireCache.filter(i => i.type_item === currentFilterBiblio);
    
    if (showFavBiblio) {
        items = items.filter(i => i.favori);
    }

    if (searchQueryBiblio) {
        items = items.filter(i => i.nom.toLowerCase().includes(searchQueryBiblio));
    }
    
    items = trierVocabulaire(items, currentSortBiblio);
    
    const container = document.getElementById('liste-vocabulaire');
    container.innerHTML = "";
    
    if (items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Aucun élément trouvé.</div>`; return;
    }

    items.forEach(item => {
        const imageHtml = genererMediaHtml(item);
        const nomSafe = item.nom.replace(/'/g, "\\'");
        const sousCatBadge = item.sous_categorie ? `<span class="vocab-meta badge">${item.sous_categorie}</span>` : "";

        const favBtnClass = item.favori ? "btn-action btn-ghost-red btn-square" : "btn-action btn-ghost-neutral btn-square";
        const favIcon = item.favori ? svgHeartFilled : svgHeartOutline;

        container.innerHTML += `
            <div class="vocab-card">
                ${imageHtml}
                <div class="vocab-details">
                    <span class="vocab-title">${item.nom}</span>
                    <span class="vocab-meta badge">${item.type_item}</span>
                    ${sousCatBadge}
                    <span class="vocab-meta" style="margin-left: 8px;">Pratiqué ${item.nb_pratiques} fois</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="${favBtnClass}" onclick="toggleFavori(${item.id}, event)" title="Favori">
                        ${favIcon}
                    </button>
                    <button class="btn-action btn-ghost-blue btn-square" onclick="editerVocabulaire(${item.id}, '${nomSafe}', '${item.type_item}', '${item.sous_categorie || ""}')" title="Modifier">
                        ${svgPencil}
                    </button>
                    <button class="btn-action btn-ghost-red btn-square" onclick="supprimerVocabulaire(${item.id})" title="Supprimer">
                        ${svgTrash}
                    </button>
                </div>
            </div>
        `;
    });
}

function editerVocabulaire(id, nom, type, sousCat) {
    editVocabId = id;
    document.getElementById('input-vocab-nom').value = nom;
    document.getElementById('input-vocab-type').value = type;
    gererSousCategoriesForm();
    if(sousCat) document.getElementById('input-vocab-sous-type').value = sousCat;
    
    const btn = document.getElementById('btn-submit-vocab');
    btn.innerHTML = `${svgSave} Enregistrer`;
    btn.className = 'btn-action btn-ghost-blue';
    
    if(!document.getElementById('btn-cancel-edit')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button'; cancelBtn.id = 'btn-cancel-edit';
        cancelBtn.className = 'btn-action btn-ghost-neutral';
        cancelBtn.innerText = 'Annuler'; cancelBtn.onclick = annulerEdition;
        document.getElementById('container-btn-vocab').appendChild(cancelBtn);
    }
    document.getElementById('form-vocabulaire').scrollIntoView({behavior: 'smooth'});
}

function annulerEdition() {
    editVocabId = null; document.getElementById('form-vocabulaire').reset();
    gererSousCategoriesForm();
    const btn = document.getElementById('btn-submit-vocab');
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-right: 8px;"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Ajouter`;
    btn.className = 'btn-action btn-ghost-green';
    const cancelBtn = document.getElementById('btn-cancel-edit');
    if(cancelBtn) cancelBtn.remove();
}

async function supprimerVocabulaire(id) {
    if(!confirm("Supprimer cet élément de la bibliothèque ?")) return;
    try { await fetch(`${API_URL}/vocabulaire/${id}`, { method: 'DELETE' }); chargerVocabulaireApi(); } catch(e) { console.error(e); }
}

async function ouvrirModalCarnet(categorieActive, event) {
    if(event) event.stopPropagation();
    
    carnetCategorieActive = categorieActive;
    document.getElementById('titre-modal-carnet').textContent = categorieActive;
    
    document.getElementById('search-carnet').value = '';
    searchQueryCarnet = '';
    
    const ddCarnet = document.getElementById('dd-filter-carnet');
    const contentCarnet = document.getElementById('content-filter-carnet');
    
    if (SOUS_CATEGORIES[categorieActive]) {
        ddCarnet.style.display = 'inline-block';
        document.getElementById('label-filter-carnet').innerText = 'Toutes les sous-catégories';
        currentFilterCarnet = 'Toutes';
        
        let html = `<button onclick="setFilter('carnet', 'Toutes', 'Toutes les sous-catégories')" id="filter-carnet-Toutes" class="active">Toutes les sous-catégories</button>`;
        
        SOUS_CATEGORIES[categorieActive].forEach(sc => {
            const safeId = sc.replace(/[^a-zA-Z0-9]/g, '_');
            const safeVal = sc.replace(/'/g, "\\'");
            html += `<button onclick="setFilter('carnet', '${safeVal}', '${safeVal}')" id="filter-carnet-${safeId}">${sc}</button>`;
        });
        contentCarnet.innerHTML = html;
    } else {
        ddCarnet.style.display = 'none';
    }

    document.getElementById('modal-carnet').style.display = 'flex';
    if(vocabulaireCache.length === 0) await chargerVocabulaireApi();
    renderCarnet();
}

function renderCarnet() {
    let items = vocabulaireCache.filter(i => i.type_item === carnetCategorieActive);
    
    if (currentFilterCarnet && currentFilterCarnet !== "Toutes") {
        items = items.filter(i => i.sous_categorie === currentFilterCarnet);
    }
    if (showFavCarnet) {
        items = items.filter(i => i.favori);
    }
    
    if (searchQueryCarnet) {
        items = items.filter(i => i.nom.toLowerCase().includes(searchQueryCarnet));
    }
    
    items = trierVocabulaire(items, currentSortCarnet);
    
    const container = document.getElementById('contenu-modal-carnet'); container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Aucun élément à afficher.</div>`;
        return;
    }

    items.forEach(item => {
        const imageHtml = genererMediaHtml(item);
        const sousCatBadge = item.sous_categorie ? `<span class="vocab-meta badge">${item.sous_categorie}</span>` : "";

        const isPracticed = licksPratiquesSession.has(item.id);
        const btnClass = isPracticed ? "btn-action btn-practiced btn-square" : "btn-action btn-ghost-yellow btn-square";
        const btnTitle = isPracticed ? "Déjà pratiqué !" : "Marquer comme bossé aujourd'hui";
        const onClickAttr = isPracticed ? "" : `onclick="pratiquerVocabulaire(${item.id}, this)"`;

        const favBtnClass = item.favori ? "btn-action btn-ghost-red btn-square" : "btn-action btn-ghost-neutral btn-square";
        const favIcon = item.favori ? svgHeartFilled : svgHeartOutline;

        container.innerHTML += `
            <div class="vocab-card" style="background-color: var(--bg-color);">
                ${imageHtml}
                <div class="vocab-details">
                    <span class="vocab-title">${item.nom}</span>
                    <span class="vocab-meta badge">${item.type_item}</span>
                    ${sousCatBadge}
                    <span class="vocab-meta" style="margin-left: 8px;" id="count-vocab-${item.id}">Pratiqué ${item.nb_pratiques} fois</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="${favBtnClass}" onclick="toggleFavori(${item.id}, event)" title="Favori">
                        ${favIcon}
                    </button>
                    <button class="${btnClass}" ${onClickAttr} title="${btnTitle}">
                        ${svgTickNoMargin}
                    </button>
                </div>
            </div>
        `;
    });
}

function fermerModalCarnet() { document.getElementById('modal-carnet').style.display = 'none'; }

async function pratiquerVocabulaire(id, btnElement) {
    try {
        licksPratiquesSession.add(id);

        await fetch(`${API_URL}/vocabulaire/${id}/pratiquer`, { method: 'PUT' });
        const span = document.getElementById(`count-vocab-${id}`);
        const match = span.textContent.match(/Pratiqué (\d+) fois/);
        if (match) span.textContent = `Pratiqué ${parseInt(match[1]) + 1} fois`;
        
        btnElement.classList.replace('btn-ghost-yellow', 'btn-practiced');
        btnElement.onclick = null;
        btnElement.title = "Déjà pratiqué !";

        fetch(`${API_URL}/vocabulaire`).then(r => r.json()).then(data => vocabulaireCache = data);

    } catch(e) { console.error(e); }
}

function ouvrirModalImage(src) {
    document.getElementById('image-fullscreen-src').src = src; document.getElementById('modal-image-fullscreen').style.display = 'flex';
}
function fermerModalImage() {
    document.getElementById('modal-image-fullscreen').style.display = 'none'; document.getElementById('image-fullscreen-src').src = "";
}

// ==========================================
// --- GESTION DES ROUTINES ---
// ==========================================

function ouvrirModalRoutines() {
    document.getElementById('modal-routines').style.display = 'flex';
    chargerRoutinesApi();
}

function fermerModalRoutines() {
    document.getElementById('modal-routines').style.display = 'none';
}

function ouvrirModalSaveRoutine() {
    if (itemsBrouillon.length === 0) return;
    
    document.getElementById('input-routine-nom').value = '';
    document.getElementById('titre-modal-save-routine').textContent = "Créer une routine";
    
    document.getElementById('modal-save-routine').style.display = 'flex';
    setTimeout(() => { document.getElementById('input-routine-nom').focus(); }, 100);
}

function fermerModalSaveRoutine() {
    document.getElementById('modal-save-routine').style.display = 'none';
}

async function chargerRoutinesApi() {
    try {
        const res = await fetch(`${API_URL}/routines`);
        routinesCache = await res.json();
        renderRoutines();
    } catch(e) { console.error("Erreur chargement routines :", e); }
}

function renderRoutines() {
    const container = document.getElementById('liste-routines-container');
    container.innerHTML = "";
    
    if (routinesCache.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Aucune routine enregistrée.</div>`;
        return;
    }
    
    routinesCache.forEach(routine => {
        let tempsTotal = 0;
        let categories = new Set();
        
        routine.items.forEach(item => {
            tempsTotal += Number(item.temps_prevu);
            categories.add(item.categorie);
        });
        
        const h = Math.floor(tempsTotal / 60);
        const m = (tempsTotal % 60).toString().padStart(2, '0');
        const tempsFormate = `${h}h${m}`;
        
        let badgesHtml = Array.from(categories)
            .map(cat => `<span class="badge badge-blue" style="margin-right: 4px; margin-bottom: 4px; display: inline-block;">${cat}</span>`)
            .join('');
        
        container.innerHTML += `
            <div class="routine-item" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; cursor: pointer;" onclick="chargerRoutineDansBrouillon(${routine.id})">
                <div style="flex: 1; min-width: 200px;">
                    <span style="font-weight: 600; color: var(--text-primary); font-size: 15px; display: block; margin-bottom: 4px;">${routine.nom}</span>
                    <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <span class="badge-temps" style="background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); padding: 2px 8px; font-size: 12px; min-width: auto; margin:0;">${tempsFormate}</span>
                        <div>${badgesHtml}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-action btn-ghost-red btn-square" onclick="event.stopPropagation(); supprimerRoutine(${routine.id})" title="Supprimer">
                        ${svgTrash}
                    </button>
                </div>
            </div>
        `;
    });
}

function chargerRoutineDansBrouillon(id) {
    const routine = routinesCache.find(r => r.id === id);
    if (!routine) return;
    
    routine.items.forEach(item => {
        itemsBrouillon.push({
            ...item,
            fait: false,
            ordre: itemsBrouillon.length
        });
    });
    
    afficherBrouillon();
    fermerModalRoutines();
}

async function sauvegarderRoutineEnBase() {
    const nomInput = document.getElementById('input-routine-nom').value.trim();
    if (!nomInput) return;
    if (itemsBrouillon.length === 0) return;
    
    const btn = document.getElementById('btn-valider-routine');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Enregistrement...'; 
    btn.disabled = true;
    
    const routineData = { 
        nom: nomInput, 
        items: itemsBrouillon 
    };
    
    try {
        await fetch(`${API_URL}/routines`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(routineData) 
        });
        
        btn.innerHTML = `${svgSaveCheck} Enregistré`;
        btn.className = 'btn-action done';
        
        setTimeout(() => {
            fermerModalSaveRoutine();
            btn.innerHTML = originalText;
            btn.className = 'btn-action btn-ghost-green';
            btn.disabled = false;
        }, 1000);
        
    } catch(e) { 
        console.error("Erreur lors de la sauvegarde de la routine :", e); 
        btn.innerHTML = originalText; 
        btn.disabled = false;
    }
}

async function supprimerRoutine(id) {
    if(!confirm("Supprimer définitivement cette routine ?")) return;
    try {
        await fetch(`${API_URL}/routines/${id}`, { method: 'DELETE' });
        chargerRoutinesApi();
    } catch(e) { console.error("Erreur lors de la suppression de la routine :", e); }
}

document.addEventListener("DOMContentLoaded", () => { initDragAndDrop(); chargerDerniereSeance(); });
let limiteHistorique = 10;

function changerLimiteHistorique(val, label) {
    limiteHistorique = val;
    document.getElementById('label-limite-historique').innerText = label;
    document.querySelectorAll('#dd-limite-historique .dropdown-content button').forEach(b => b.classList.remove('active'));
    document.getElementById(`limite-hist-${val}`).classList.add('active');
    renderHistoriqueListe();
}

function renderHistoriqueListe() {
    const listeHist = document.getElementById('liste-historique-seances'); 
    listeHist.innerHTML = "";
    
    let seancesAafficher = historiquesTerminees;
    if (limiteHistorique !== "toutes") {
        seancesAafficher = historiquesTerminees.slice(0, parseInt(limiteHistorique));
    }
    
    if (seancesAafficher.length === 0) {
        listeHist.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted);">Aucune séance terminée pour le moment.</div>`;
        return;
    }
    
    seancesAafficher.forEach(s => {
        let itemsHtml = "";
        if (s.items && Array.isArray(s.items)) {
            s.items.forEach(item => {
                if(item.fait) {
                    itemsHtml += `<span class="badge badge-neutral" style="margin-right: 4px; margin-bottom: 4px; display: inline-block;">${item.categorie}</span>`;
                }
            });
        }
        
        const [y, m, day] = s.date_seance.split('-');
        const dateBrute = new Date(y, m - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        const dateFormatee = dateBrute.charAt(0).toUpperCase() + dateBrute.slice(1);
        const dureeFormatee = formatDureeHistorique(s.tempsTotalCalc || 0);

        listeHist.innerHTML += `
            <div class="history-item">
                <div class="item-header" style="align-items: center;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div>
                            <span class="categorie" style="color: var(--text-primary);">${dateFormatee}</span>
                            <span style="color: var(--text-muted); margin-left: 8px; font-size: 14px;">${formatTonalite(s.tonalite_du_jour)}</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span class="badge-temps" style="color: var(--text-primary); border-color: var(--border-color); background: transparent; margin:0;">${dureeFormatee}</span>
                        <button class="btn-action btn-ghost-red btn-square" onclick="supprimerSeance(${s.id})" title="Supprimer la séance" style="height: 28px; width: 28px;">
                            ${svgTrash}
                        </button>
                    </div>
                </div>
                <div style="margin-top: 8px;">${itemsHtml}</div>
            </div>`;
    });
}

// ==========================================
// --- GESTION PWA & SERVICE WORKER ---
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker enregistré avec succès !', registration.scope);
            })
            .catch(error => {
                console.error('Erreur lors de l\'enregistrement du Service Worker :', error);
            });
    });
}