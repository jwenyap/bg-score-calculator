'use strict';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const GOODS = [
  { id: 'brick', name: 'Brick', emoji: '🧱', rate: 3 },
  { id: 'wheat', name: 'Wheat', emoji: '🌾', rate: 4 },
  { id: 'tool',  name: 'Tool',  emoji: '⚒️',  rate: 5 },
  { id: 'wine',  name: 'Wine',  emoji: '🍷',  rate: 6 },
  { id: 'cloth', name: 'Cloth', emoji: '🧵',  rate: 7 }
];

const MINERVA_CARDS = [
  { id: 'mason',   name: 'Mason',   city: 'brick cities',      vpPer: 3 },
  { id: 'farmer',  name: 'Farmer',  city: 'food/wheat cities', vpPer: 3 },
  { id: 'smith',   name: 'Smith',   city: 'tool cities',       vpPer: 3 },
  { id: 'vintner', name: 'Vintner', city: 'wine cities',       vpPer: 4 },
  { id: 'weaver',  name: 'Weaver',  city: 'cloth cities',      vpPer: 5 }
];

const GAMES = {
  concordia: {
    id: 'concordia',
    name: 'Concordia',
    subtitle: 'Ancient Mediterranean Trading',
    emoji: '🏛️',
    minPlayers: 2,
    maxPlayers: 5,
    concordiaCardVP: 7,
    categories: [
      {
        id: 'vesta',
        name: 'VESTA',
        emoji: '🔥',
        color: '#C0622B',
        type: 'vesta',
        title: 'Goddess of the Hearth',
        rule: 'Add the value of all goods in your storehouse to your cash. Receive 1 VP per full 10 sestertii.'
      },
      {
        id: 'iuppiter',
        name: 'JUPITER',
        emoji: '👑',
        color: '#6B42A3',
        type: 'simple',
        title: 'King of the Gods',
        rule: 'Receive 1 VP for each of your houses inside a non-brick city.',
        inputLabel: 'Houses in non-brick cities',
        inputUnit: 'houses',
        cardsUnit: 'Jupiter cards',
        vpPer: 1
      },
      {
        id: 'saturnus',
        name: 'SATURNUS',
        emoji: '🌾',
        color: '#3D8B5A',
        type: 'simple',
        title: 'God of Agriculture',
        rule: 'Receive 1 VP for each province where you have at least one house.',
        inputLabel: 'Provinces with at least 1 house',
        inputUnit: 'provinces',
        cardsUnit: 'Saturnus cards',
        vpPer: 1
      },
      {
        id: 'mercurius',
        name: 'MERCURIUS',
        emoji: '⚡',
        color: '#1E7A8C',
        type: 'simple',
        title: 'God of Commerce',
        rule: 'Receive 2 VP for each type of goods that you produce with your houses.',
        inputLabel: 'Types of goods produced',
        inputUnit: 'types',
        cardsUnit: 'Mercurius cards',
        vpPer: 2
      },
      {
        id: 'mars',
        name: 'MARS',
        emoji: '⚔️',
        color: '#B83232',
        type: 'simple',
        title: 'God of War',
        rule: 'Receive 2 VP for each of your colonists on the game board.',
        inputLabel: 'Colonists on the board',
        inputUnit: 'colonists',
        cardsUnit: 'Mars cards',
        vpPer: 2
      },
      {
        id: 'minerva',
        name: 'MINERVA',
        emoji: '🦉',
        color: '#2B5BA3',
        type: 'minerva',
        title: 'Goddess of Wisdom',
        rule: 'For each city of the related city type, receive the VP shown on your specialist\'s card.'
      }
    ]
  }
};

const PLAYER_COLORS = ['#1B3A6B', '#B83232', '#2D7D46', '#B8882A', '#6B42A3'];
const MEDALS = ['🥇', '🥈', '🥉'];
const STORE = { history: 'bgs_history', current: 'bgs_current' };

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

function loadStored(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

let state = {
  screen: 'home',
  selectedGameId: null,
  setupData: null,
  currentGame: loadStored(STORE.current),
  history: loadStored(STORE.history) || [],
  viewingHistoryIndex: 0,
  scoringTab: null
};

function persistCurrent() {
  if (state.currentGame) {
    localStorage.setItem(STORE.current, JSON.stringify(state.currentGame));
  } else {
    localStorage.removeItem(STORE.current);
  }
}

function persistHistory() {
  localStorage.setItem(STORE.history, JSON.stringify(state.history));
}

// ═══════════════════════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════════════════════

function getVestaVP(scores) {
  const s = scores.vesta || {};
  const goodsTotal = GOODS.reduce((sum, g) => sum + (parseInt(s[g.id]) || 0) * g.rate, 0);
  const cash = parseInt(s.cash) || 0;
  return Math.floor((goodsTotal + cash) / 10);
}

function getVestaSestertii(scores) {
  const s = scores.vesta || {};
  const goodsTotal = GOODS.reduce((sum, g) => sum + (parseInt(s[g.id]) || 0) * g.rate, 0);
  return goodsTotal + (parseInt(s.cash) || 0);
}

function getSimpleVP(scores, cat) {
  const s = scores[cat.id] || {};
  const count = parseInt(s.count) || 0;
  const cards = parseInt(s.cards) || 0;
  return count * cards * cat.vpPer;
}

function getMinervaVP(scores) {
  const s = scores.minerva || {};
  if (!s.card) return 0;
  const card = MINERVA_CARDS.find(c => c.id === s.card);
  return card ? (parseInt(s.houses) || 0) * card.vpPer : 0;
}

function getConcordiaCardVP(scores, game) {
  return (scores.concordia_card && scores.concordia_card.hasCard) ? game.concordiaCardVP : 0;
}

function getCatScore(scores, cat, game) {
  if (cat.type === 'vesta')   return getVestaVP(scores);
  if (cat.type === 'simple')  return getSimpleVP(scores, cat);
  if (cat.type === 'minerva') return getMinervaVP(scores);
  return 0;
}

function getPlayerTotal(player, gameId) {
  const game = GAMES[gameId];
  const catTotal = game.categories.reduce((sum, cat) => sum + getCatScore(player.scores, cat, game), 0);
  return catTotal + getConcordiaCardVP(player.scores, game);
}

function getRanked(players, gameId, praefectus) {
  return players
    .map((p, i) => ({ ...p, _index: i, total: getPlayerTotal(p, gameId) }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (praefectus === b._index) return 1;
      if (praefectus === a._index) return -1;
      return 0;
    });
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function h(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pc(i) { return PLAYER_COLORS[i % PLAYER_COLORS.length]; }

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function initScores(game) {
  return {
    vesta: { brick: '', wheat: '', tool: '', wine: '', cloth: '', cash: '' },
    iuppiter:  { count: '', cards: '' },
    saturnus:  { count: '', cards: '' },
    mercurius: { count: '', cards: '' },
    mars:      { count: '', cards: '' },
    minerva:   { card: '', houses: '' },
    concordia_card: { hasCard: false }
  };
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ═══════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════

function render() {
  const screens = {
    home: renderHome, gameSelect: renderGameSelect, setup: renderSetup,
    scoring: renderScoring, results: renderResults,
    history: renderHistory, historyDetail: renderHistoryDetail
  };
  document.getElementById('app').innerHTML = (screens[state.screen] || renderHome)();

  document.querySelectorAll('.num-input').forEach(el => {
    el.addEventListener('input', onNumInput);
    el.addEventListener('focus', e => e.target.select());
  });
  document.querySelectorAll('.player-name-input').forEach(el => {
    el.addEventListener('input', onNameInput);
  });
  document.querySelectorAll('.minerva-select').forEach(el => {
    el.addEventListener('change', onMinervaCardChange);
  });
  document.querySelectorAll('.concordia-cb').forEach(el => {
    el.addEventListener('change', onConcordiaCardChange);
  });
  document.querySelectorAll('.praefectus-radio').forEach(el => {
    el.addEventListener('change', onPraefectusChange);
  });
}

// ── HOME ────────────────────────────────────────────────────

function renderHome() {
  const hasCurrent = !!state.currentGame;
  const hasHistory = state.history.length > 0;
  const game = hasCurrent ? GAMES[state.currentGame.gameId] : null;

  return `
<div class="screen home-screen">
  <div class="home-hero">
    <div class="home-logo">🎲</div>
    <h1 class="home-title">Board Game<br>Score Calculator</h1>
    <p class="home-sub">Track points for your favorite games</p>
  </div>
  <div class="home-actions">
    ${hasCurrent ? `
    <button class="btn btn-primary btn-lg" data-action="resume">
      <span>▶ Resume Game</span>
      <span class="btn-tag">${game.name} · ${state.currentGame.players.length} players</span>
    </button>` : ''}
    <button class="btn ${hasCurrent ? 'btn-outline' : 'btn-primary btn-lg'}" data-action="newGame">
      + New Game
    </button>
    ${hasHistory ? `
    <button class="btn btn-ghost" data-action="viewHistory">
      📋 History (${state.history.length})
    </button>` : ''}
  </div>
</div>`;
}

// ── GAME SELECT ──────────────────────────────────────────────

function renderGameSelect() {
  const gameCards = Object.values(GAMES).map(g => `
<button class="game-card" data-action="selectGame" data-game="${g.id}">
  <span class="game-emoji">${g.emoji}</span>
  <div class="game-info">
    <div class="game-name">${h(g.name)}</div>
    <div class="game-meta">${h(g.subtitle)} · ${g.minPlayers}–${g.maxPlayers} players</div>
  </div>
  <span class="chevron">›</span>
</button>`).join('');

  return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="goHome">‹ Back</button>
      <h2 class="screen-title">Choose a Game</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="list-content">
    ${gameCards}
    <div class="game-card game-card-soon">
      <span class="game-emoji">🔜</span>
      <div class="game-info">
        <div class="game-name">More games coming soon</div>
        <div class="game-meta">Concordia Venus, Salsa &amp; more</div>
      </div>
    </div>
  </div>
</div>`;
}

// ── SETUP ────────────────────────────────────────────────────

function renderSetup() {
  const game = GAMES[state.selectedGameId];
  const sd = state.setupData;
  const count = sd.playerCount;

  const countBtns = Array.from({ length: game.maxPlayers - game.minPlayers + 1 }, (_, i) => {
    const n = game.minPlayers + i;
    return `<button class="count-btn${count === n ? ' active' : ''}" data-action="setCount" data-n="${n}">${n}</button>`;
  }).join('');

  const nameInputs = Array.from({ length: count }, (_, i) => `
<div class="name-row">
  <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
  <input class="text-input player-name-input" type="text"
    data-pi="${i}" maxlength="20"
    placeholder="Player ${i + 1}"
    value="${h(sd.names[i] || '')}">
</div>`).join('');

  return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="goGameSelect">‹ Back</button>
      <h2 class="screen-title">New Game</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="form-content">
    <div class="game-badge">${game.emoji} ${h(game.name)}</div>
    <div class="form-section">
      <div class="form-label">Number of players</div>
      <div class="count-row">${countBtns}</div>
    </div>
    <div class="form-section">
      <div class="form-label">Player names</div>
      <div class="name-list">${nameInputs}</div>
    </div>
    <button class="btn btn-primary btn-lg" data-action="startGame">Start Game</button>
  </div>
</div>`;
}

// ── SCORING ──────────────────────────────────────────────────

function getScoringTabs(game) {
  return [
    ...game.categories.map(c => ({ id: c.id, emoji: c.emoji, label: c.name })),
    { id: 'finish', emoji: '✓', label: 'Finish' }
  ];
}

function renderScoring() {
  const cg = state.currentGame;
  const game = GAMES[cg.gameId];
  const players = cg.players;
  const tabs = getScoringTabs(game);
  const activeTab = state.scoringTab || tabs[0].id;
  const activeIdx = tabs.findIndex(t => t.id === activeTab);
  const hasPrev = activeIdx > 0;
  const hasNext = activeIdx < tabs.length - 1;

  const tabBar = tabs.map(t => `
<button class="tab-btn${t.id === activeTab ? ' active' : ''}"
  data-action="setTab" data-tab="${t.id}">
  <span class="tab-emoji">${t.emoji}</span>
  <span class="tab-label">${t.label}</span>
</button>`).join('');

  let tabContent = '';
  if (activeTab === 'finish') {
    tabContent = renderFinishTab(players, game);
  } else {
    const cat = game.categories.find(c => c.id === activeTab);
    if (cat) {
      if (cat.type === 'vesta')   tabContent = renderVestaSection(players, cat);
      if (cat.type === 'simple')  tabContent = renderSimpleSection(players, cat);
      if (cat.type === 'minerva') tabContent = renderMinervaSection(players, cat);
    }
  }

  const prevTab = hasPrev ? tabs[activeIdx - 1] : null;
  const nextTab = hasNext ? tabs[activeIdx + 1] : null;

  return `
<div class="screen">
  <div class="screen-header sticky-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="quitGame">✕ Quit</button>
      <h2 class="screen-title">${h(game.name)}</h2>
      <button class="hdr-btn hdr-right" data-action="showResults">Results ›</button>
    </div>
    <div class="scoring-tabs">${tabBar}</div>
  </div>
  <div class="sc-content">
    ${tabContent}
    <div id="total-scores" class="total-results-card">
      ${renderTotalScoresContent(players, game.id)}
    </div>
    <div class="tab-nav-bar">
      ${hasPrev
        ? `<button class="btn btn-outline tab-nav-btn" data-action="setTab" data-tab="${prevTab.id}">‹ ${prevTab.emoji} ${prevTab.label}</button>`
        : `<div></div>`}
      ${hasNext
        ? `<button class="btn btn-primary tab-nav-btn" data-action="setTab" data-tab="${nextTab.id}">${nextTab.emoji} ${nextTab.label} ›</button>`
        : `<button class="btn btn-primary tab-nav-btn" data-action="showResults">View Results ›</button>`}
    </div>
  </div>
</div>`;
}

function renderFinishTab(players, game) {
  return `
<div class="sc-finish">
  ${renderConcordiaCardSection(players, game)}
  ${renderPraefectusSection(players, game)}
</div>`;
}

function renderPraefectusSection(players, game) {
  const praefectus = state.currentGame.praefectusPlayer ?? null;
  const options = [
    `<label class="praefectus-label${praefectus === null ? ' selected' : ''}">
      <input type="radio" class="praefectus-radio" name="praefectus" value="-1"${praefectus === null ? ' checked' : ''}>
      <span class="praefectus-none">Nobody / Not yet assigned</span>
    </label>`,
    ...players.map((p, i) => `
    <label class="praefectus-label${praefectus === i ? ' selected' : ''}">
      <input type="radio" class="praefectus-radio" name="praefectus" value="${i}"${praefectus === i ? ' checked' : ''}>
      <div class="player-dot player-dot-sm" style="background:${pc(i)}">${i + 1}</div>
      <span class="praefectus-name">${h(p.name)}</span>
    </label>`)
  ].join('');

  return `
<div class="god-section praefectus-section">
  <div class="god-header" style="--gc:#7A6A50">
    <span class="god-emoji">⚖️</span>
    <div>
      <div class="god-name">PRÆFECTUS MAGNUS</div>
      <div class="god-title">Tiebreaker</div>
    </div>
  </div>
  <div class="god-rule">In case of a tie, the player holding the PRÆFECTUS MAGNUS card wins. If no player holds it yet, the tied player who would receive it next wins.</div>
  <div class="praefectus-options">${options}</div>
</div>`;
}

function renderGodHeader(cat) {
  return `
<div class="god-header" style="--gc:${cat.color}">
  <span class="god-emoji">${cat.emoji}</span>
  <div>
    <div class="god-name">${cat.name}</div>
    <div class="god-title">${h(cat.title)}</div>
  </div>
</div>
<div class="god-rule">${h(cat.rule)}</div>`;
}

function renderVestaSection(players, cat) {
  const playerCards = players.map((p, i) => {
    const s = p.scores.vesta || {};
    const goodsRows = GOODS.map(g => {
      const qty = s[g.id] ?? '';
      const val = (parseInt(s[g.id]) || 0) * g.rate;
      return `
<div class="good-row">
  <span class="good-label">${g.emoji} ${g.name} <span class="good-rate">×${g.rate}🪙</span></span>
  <input class="num-input num-input-xs" type="number" inputmode="numeric" min="0"
    data-type="goods" data-player="${i}" data-good="${g.id}"
    value="${h(qty)}" placeholder="0">
  <span class="good-val" id="gv-${g.id}-${i}">${val}🪙</span>
</div>`;
    }).join('');

    const cash = s.cash ?? '';
    const sesterces = getVestaSestertii(p.scores);
    const vp = getVestaVP(p.scores);

    return `
<div class="vesta-player-card">
  <div class="vplayer-header">
    <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
    <span class="vplayer-name">${h(p.name)}</span>
    <span class="vplayer-vp" id="vp-vesta-${i}">${vp} VP</span>
  </div>
  <div class="goods-grid">${goodsRows}
    <div class="good-row cash-row">
      <span class="good-label">💰 Cash</span>
      <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
        data-type="cash" data-player="${i}"
        value="${h(cash)}" placeholder="0">
      <span class="good-val">🪙</span>
    </div>
  </div>
  <div class="vesta-total">
    <span id="st-${i}">${sesterces}</span>🪙 ÷ 10 = <strong id="vvp-${i}">${vp}</strong> VP
  </div>
</div>`;
  }).join('');

  return `
<div class="god-section" id="section-vesta">
  ${renderGodHeader(cat)}
  <div class="god-players vesta-players">${playerCards}</div>
</div>`;
}

function renderSimpleSection(players, cat) {
  const cards = players.map((p, i) => {
    const s = p.scores[cat.id] || {};
    const count = s.count ?? '';
    const cardsVal = s.cards ?? '';
    const vp = getSimpleVP(p.scores, cat);
    return `
<div class="simple-player-card">
  <div class="vplayer-header">
    <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
    <span class="vplayer-name">${h(p.name)}</span>
    <span class="vplayer-vp" id="vp-${cat.id}-${i}">${vp} VP</span>
  </div>
  <div class="simple-inputs">
    <div class="simple-input-row">
      <label class="ig-label">${h(cat.inputLabel)}</label>
      <div class="simple-input-field">
        <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
          data-type="count" data-player="${i}" data-cat="${cat.id}"
          value="${h(count)}" placeholder="0">
        <span class="input-unit">${h(cat.inputUnit)}</span>
      </div>
    </div>
    <div class="simple-input-row">
      <label class="ig-label">${h(cat.cardsUnit)}</label>
      <div class="simple-input-field">
        <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
          data-type="cards" data-player="${i}" data-cat="${cat.id}"
          value="${h(cardsVal)}" placeholder="0">
        <span class="input-unit">cards</span>
      </div>
    </div>
  </div>
</div>`;
  }).join('');

  return `
<div class="god-section" id="section-${cat.id}">
  ${renderGodHeader(cat)}
  <div class="god-players simple-players">${cards}</div>
</div>`;
}

function renderMinervaSection(players, cat) {
  const cardOptions = MINERVA_CARDS.map(c =>
    `<option value="${c.id}">${c.name} — ${c.city}, ${c.vpPer} VP/house</option>`
  ).join('');

  const playerCards = players.map((p, i) => {
    const s = p.scores.minerva || {};
    const selectedCard = MINERVA_CARDS.find(c => c.id === s.card);
    const hint = selectedCard
      ? `${selectedCard.vpPer} VP per house in ${selectedCard.city}`
      : 'Select your specialist card';
    const houses = s.houses ?? '';
    const vp = getMinervaVP(p.scores);

    return `
<div class="minerva-player-card">
  <div class="vplayer-header">
    <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
    <span class="vplayer-name">${h(p.name)}</span>
    <span class="vplayer-vp" id="vp-minerva-${i}">${vp} VP</span>
  </div>
  <div class="minerva-inputs">
    <select class="select-input minerva-select" data-player="${i}">
      <option value="">Select specialist card…</option>
      ${MINERVA_CARDS.map(c => `<option value="${c.id}"${s.card === c.id ? ' selected' : ''}>${c.name} — ${c.city}, ${c.vpPer} VP/house</option>`).join('')}
    </select>
    <div class="minerva-hint" id="mhint-${i}">${h(hint)}</div>
    <div class="minerva-count-row">
      <label class="ig-label">Houses in matching city</label>
      <div class="minerva-count-inputs">
        <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
          data-type="minerva-houses" data-player="${i}"
          value="${h(houses)}" placeholder="0">
        <span class="pr-vp" id="vp-minerva-${i}-calc">= ${vp} VP</span>
      </div>
    </div>
  </div>
</div>`;
  }).join('');

  return `
<div class="god-section" id="section-minerva">
  ${renderGodHeader(cat)}
  <div class="god-players minerva-players">${playerCards}</div>
</div>`;
}

function renderConcordiaCardSection(players, game) {
  const checks = players.map((p, i) => {
    const hasCard = p.scores.concordia_card?.hasCard || false;
    return `
<label class="concordia-check-label${hasCard ? ' checked' : ''}">
  <input type="checkbox" class="concordia-cb" data-player="${i}"${hasCard ? ' checked' : ''}>
  <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
  <span class="cc-name">${h(p.name)}</span>
  <span class="cc-vp">${hasCard ? game.concordiaCardVP + ' VP' : '0 VP'}</span>
</label>`;
  }).join('');

  return `
<div class="god-section concordia-card-section">
  <div class="god-header" style="--gc:#B8882A">
    <span class="god-emoji">🕊️</span>
    <div>
      <div class="god-name">CONCORDIA CARD</div>
      <div class="god-title">Goddess of Harmony</div>
    </div>
  </div>
  <div class="god-rule">The first player to build 15 houses, or to buy the last personality card, earns ${game.concordiaCardVP} VP.</div>
  <div class="concordia-checks">${checks}</div>
</div>`;
}

function renderTotalScoresContent(players, gameId) {
  const praefectus = state.currentGame?.praefectusPlayer ?? null;
  const ranked = getRanked(players, gameId, praefectus);
  const rows = ranked.map((p, rank) => `
<div class="total-row">
  <span class="total-medal">${MEDALS[rank] ?? ''}</span>
  <div class="player-dot player-dot-sm" style="background:${pc(p._index)}">${p._index + 1}</div>
  <span class="total-name">${h(p.name)}</span>
  <span class="total-vp" id="vp-total-${p._index}">${p.total} VP</span>
</div>`).join('');

  return `
<div class="total-header">Live Scores</div>
${rows}`;
}

// ── RESULTS ──────────────────────────────────────────────────

function renderResults() {
  const cg = state.currentGame;
  const game = GAMES[cg.gameId];
  const praefectus = cg.praefectusPlayer ?? null;
  const ranked = getRanked(cg.players, game.id, praefectus);

  const podium = ranked.map((p, rank) => `
<div class="podium-item${rank === 0 ? ' winner' : ''}">
  <div class="pod-medal">${MEDALS[rank] ?? '#' + (rank + 1)}</div>
  <div class="pod-dot" style="background:${pc(p._index)}">${p._index + 1}</div>
  <div class="pod-name">${h(p.name)}</div>
  <div class="pod-total">${p.total}</div>
</div>`).join('');

  // Detect ties involving praefectus
  let tieNote = '';
  if (ranked.length >= 2 && ranked[0].total === ranked[1].total && praefectus !== null) {
    const winner = ranked[0];
    tieNote = `<div class="tie-note">🤝 Tie broken by PRÆFECTUS MAGNUS — ${h(winner.name)} wins</div>`;
  }

  const breakdowns = ranked.map(p => {
    const rows = game.categories.map(cat => {
      const score = getCatScore(p.scores, cat, game);
      let detail = '';
      if (cat.type === 'vesta') {
        const s = getVestaSestertii(p.scores);
        detail = `${s}🪙 ÷ 10`;
      } else if (cat.type === 'simple') {
        const s = p.scores[cat.id] || {};
        const cnt = s.count || 0;
        const cds = s.cards || 0;
        detail = `${cds} cards × ${cnt} × ${cat.vpPer}`;
      } else if (cat.type === 'minerva') {
        const s = p.scores.minerva || {};
        const card = MINERVA_CARDS.find(c => c.id === s.card);
        detail = card ? `${s.houses || 0} × ${card.vpPer} (${card.name})` : '—';
      }
      return `
<div class="bd-row${score === 0 ? ' muted' : ''}">
  <span>${cat.emoji} ${cat.name}</span>
  <span class="bd-calc">${detail}</span>
  <span class="bd-pts">${score}</span>
</div>`;
    }).join('');

    const cardVP = getConcordiaCardVP(p.scores, game);
    const concordiaRow = cardVP ? `
<div class="bd-row">
  <span>🕊️ Concordia Card</span>
  <span class="bd-calc">earned</span>
  <span class="bd-pts">${cardVP}</span>
</div>` : '';

    return `
<details class="bd-card">
  <summary class="bd-head">
    <div class="bd-player">
      <div class="player-dot" style="background:${pc(p._index)}">${p._index + 1}</div>
      <span>${h(p.name)}</span>
    </div>
    <span class="bd-total">${p.total} pts</span>
  </summary>
  <div class="bd-body">
    ${rows}${concordiaRow}
    <div class="bd-row bd-sum">
      <span><strong>Total</strong></span>
      <span class="bd-calc"></span>
      <span class="bd-pts"><strong>${p.total}</strong></span>
    </div>
  </div>
</details>`;
  }).join('');

  return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="backToScoring">‹ Scores</button>
      <h2 class="screen-title">Final Results</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="res-content">
    <div class="res-badge">${game.emoji} ${h(game.name)}</div>
    <div class="podium">${podium}</div>
    ${tieNote}
    <div class="form-label" style="padding:0 16px">Score Breakdown</div>
    <div class="bd-list">${breakdowns}</div>
    <div class="res-actions">
      <button class="btn btn-primary" data-action="saveAndNew">💾 Save &amp; New Game</button>
      <button class="btn btn-outline" data-action="backToScoring">‹ Back to Scoring</button>
    </div>
  </div>
</div>`;
}

// ── HISTORY ──────────────────────────────────────────────────

function renderHistory() {
  if (!state.history.length) {
    return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="goHome">‹ Back</button>
      <h2 class="screen-title">History</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="empty-state">
    <div class="empty-icon">📋</div>
    <div class="empty-title">No saved games yet</div>
    <div class="empty-sub">Complete a game to see it here</div>
  </div>
</div>`;
  }

  const items = [...state.history].reverse().map((g, ri) => {
    const idx = state.history.length - 1 - ri;
    const gd = GAMES[g.gameId];
    const ranked = getRanked(g.players, g.gameId, g.praefectusPlayer ?? null);
    return `
<button class="hist-item" data-action="viewDetail" data-i="${idx}">
  <span class="hist-emoji">${gd.emoji}</span>
  <div class="hist-info">
    <div class="hist-game">${h(gd.name)}</div>
    <div class="hist-meta">${fmtDate(g.completedAt)} · ${g.players.length} players</div>
    <div class="hist-winner">🥇 ${h(ranked[0].name)} (${ranked[0].total} pts)</div>
  </div>
  <span class="chevron">›</span>
</button>`;
  }).join('');

  return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="goHome">‹ Back</button>
      <h2 class="screen-title">History</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="list-content">${items}</div>
</div>`;
}

// ── HISTORY DETAIL ───────────────────────────────────────────

function renderHistoryDetail() {
  const saved = state.history[state.viewingHistoryIndex];
  const gd = GAMES[saved.gameId];
  const ranked = getRanked(saved.players, gd.id, saved.praefectusPlayer ?? null);
  const date = new Date(saved.completedAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const breakdowns = ranked.map((p, rank) => {
    const rows = gd.categories.map(cat => {
      const score = getCatScore(p.scores, cat, gd);
      let detail = '';
      if (cat.type === 'vesta') {
        detail = `${getVestaSestertii(p.scores)}🪙 ÷ 10`;
      } else if (cat.type === 'simple') {
        const s = p.scores[cat.id] || {};
        const cnt = s.count || 0;
        const cds = s.cards || 0;
        detail = `${cds} cards × ${cnt} × ${cat.vpPer}`;
      } else if (cat.type === 'minerva') {
        const s = p.scores.minerva || {};
        const card = MINERVA_CARDS.find(c => c.id === s.card);
        detail = card ? `${s.houses || 0} × ${card.vpPer} (${card.name})` : '—';
      }
      return `
<div class="bd-row${score === 0 ? ' muted' : ''}">
  <span>${cat.emoji} ${cat.name}</span>
  <span class="bd-calc">${detail}</span>
  <span class="bd-pts">${score}</span>
</div>`;
    }).join('');

    const cardVP = getConcordiaCardVP(p.scores, gd);
    const concordiaRow = cardVP ? `
<div class="bd-row">
  <span>🕊️ Concordia Card</span>
  <span class="bd-calc">earned</span>
  <span class="bd-pts">${cardVP}</span>
</div>` : '';

    return `
<details class="bd-card" ${rank === 0 ? 'open' : ''}>
  <summary class="bd-head">
    <div class="bd-player">
      <div class="player-dot" style="background:${pc(p._index)}">${p._index + 1}</div>
      <span>${MEDALS[rank] ?? '#' + (rank + 1)} ${h(p.name)}</span>
    </div>
    <span class="bd-total">${p.total} pts</span>
  </summary>
  <div class="bd-body">
    ${rows}${concordiaRow}
    <div class="bd-row bd-sum">
      <span><strong>Total</strong></span>
      <span class="bd-calc"></span>
      <span class="bd-pts"><strong>${p.total}</strong></span>
    </div>
  </div>
</details>`;
  }).join('');

  return `
<div class="screen">
  <div class="screen-header">
    <div class="header-row">
      <button class="hdr-btn" data-action="goHistory">‹ History</button>
      <h2 class="screen-title">${h(gd.name)}</h2>
      <div style="width:64px"></div>
    </div>
  </div>
  <div class="res-content">
    <div class="res-badge">${date}</div>
    <div class="bd-list">${breakdowns}</div>
    <div class="res-actions">
      <button class="btn btn-ghost btn-danger" data-action="deleteGame" data-i="${state.viewingHistoryIndex}">
        🗑 Delete this game
      </button>
    </div>
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════════════
// EVENT HANDLING
// ═══════════════════════════════════════════════════════════

function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  const d = el.dataset;

  ({
    goHome:       () => go('home'),
    goGameSelect: () => go('gameSelect'),
    goHistory:    () => go('history'),
    newGame:      () => go('gameSelect'),
    resume:       () => { state.scoringTab = state.scoringTab || 'vesta'; go('scoring'); },
    setTab:       () => { state.scoringTab = d.tab; render(); window.scrollTo({ top: 0, behavior: 'instant' }); },
    viewHistory:  () => go('history'),

    selectGame: () => {
      state.selectedGameId = d.game;
      const game = GAMES[d.game];
      state.setupData = { playerCount: Math.min(4, game.maxPlayers), names: [] };
      go('setup');
    },

    setCount: () => {
      state.setupData.playerCount = parseInt(d.n);
      render();
    },

    startGame: () => {
      if (state.currentGame && !confirm('This will replace your current in-progress game. Continue?')) return;
      const game = GAMES[state.selectedGameId];
      const { playerCount, names } = state.setupData;
      state.currentGame = {
        gameId: state.selectedGameId,
        players: Array.from({ length: playerCount }, (_, i) => ({
          name: (names[i] || '').trim() || `Player ${i + 1}`,
          scores: initScores(game)
        })),
        praefectusPlayer: null,
        startedAt: new Date().toISOString()
      };
      state.scoringTab = 'vesta';
      persistCurrent();
      go('scoring');
    },

    showResults:   () => go('results'),
    backToScoring: () => go('scoring'),

    saveAndNew: () => {
      state.history.push({ ...state.currentGame, completedAt: new Date().toISOString() });
      persistHistory();
      state.currentGame = null;
      persistCurrent();
      go('home');
    },

    quitGame: () => {
      if (confirm('Quit? Your progress is saved and you can resume later.')) go('home');
    },

    viewDetail: () => {
      state.viewingHistoryIndex = parseInt(d.i);
      go('historyDetail');
    },

    deleteGame: () => {
      if (confirm('Delete this saved game from history?')) {
        state.history.splice(parseInt(d.i), 1);
        persistHistory();
        go('history');
      }
    }
  }[action] || (() => {}))();
}

function onNumInput(e) {
  const { type, player, good, cat } = e.target.dataset;
  const val = e.target.value;
  const i = parseInt(player);
  const p = state.currentGame.players[i];

  if (type === 'goods') {
    if (!p.scores.vesta) p.scores.vesta = {};
    p.scores.vesta[good] = val;
    refreshVestaPlayer(i);
  } else if (type === 'cash') {
    if (!p.scores.vesta) p.scores.vesta = {};
    p.scores.vesta.cash = val;
    refreshVestaPlayer(i);
  } else if (type === 'count') {
    if (!p.scores[cat]) p.scores[cat] = {};
    p.scores[cat].count = val;
    refreshSimplePlayer(i, cat);
  } else if (type === 'cards') {
    if (!p.scores[cat]) p.scores[cat] = {};
    p.scores[cat].cards = val;
    refreshSimplePlayer(i, cat);
  } else if (type === 'minerva-houses') {
    if (!p.scores.minerva) p.scores.minerva = {};
    p.scores.minerva.houses = val;
    refreshMinervaPlayer(i);
  }

  persistCurrent();
  refreshTotalScores();
}

function onMinervaCardChange(e) {
  const i = parseInt(e.target.dataset.player);
  const p = state.currentGame.players[i];
  if (!p.scores.minerva) p.scores.minerva = {};
  p.scores.minerva.card = e.target.value;

  // Update hint text
  const hintEl = document.getElementById(`mhint-${i}`);
  if (hintEl) {
    const card = MINERVA_CARDS.find(c => c.id === e.target.value);
    hintEl.textContent = card
      ? `${card.vpPer} VP per house in ${card.city}`
      : 'Select your specialist card';
  }

  persistCurrent();
  refreshMinervaPlayer(i);
  refreshTotalScores();
}

function onConcordiaCardChange(e) {
  const selected = parseInt(e.target.dataset.player);
  const game = GAMES[state.currentGame.gameId];
  // Radio behaviour: deselect all, then select this player
  state.currentGame.players.forEach((p, i) => {
    p.scores.concordia_card = { hasCard: i === selected };
  });
  // Update DOM for all labels
  document.querySelectorAll('.concordia-cb').forEach(cb => {
    const idx = parseInt(cb.dataset.player);
    const has = idx === selected;
    cb.checked = has;
    const label = cb.closest('.concordia-check-label');
    if (label) {
      label.classList.toggle('checked', has);
      const vpEl = label.querySelector('.cc-vp');
      if (vpEl) vpEl.textContent = has ? `${game.concordiaCardVP} VP` : '0 VP';
    }
  });
  persistCurrent();
  refreshTotalScores();
}

function onNameInput(e) {
  const i = parseInt(e.target.dataset.pi);
  state.setupData.names[i] = e.target.value;
}

function onPraefectusChange(e) {
  const val = parseInt(e.target.value);
  state.currentGame.praefectusPlayer = val === -1 ? null : val;
  // Update selected styling
  document.querySelectorAll('.praefectus-label').forEach(lbl => {
    lbl.classList.remove('selected');
  });
  e.target.closest('.praefectus-label')?.classList.add('selected');
  persistCurrent();
  refreshTotalScores();
}

// ── LIVE UPDATE HELPERS ──────────────────────────────────────

function refreshVestaPlayer(i) {
  const p = state.currentGame.players[i];
  const sesterces = getVestaSestertii(p.scores);
  const vp = getVestaVP(p.scores);

  // Update per-good computed values
  GOODS.forEach(g => {
    const el = document.getElementById(`gv-${g.id}-${i}`);
    const val = (parseInt((p.scores.vesta || {})[g.id]) || 0) * g.rate;
    if (el) el.textContent = `${val}🪙`;
  });

  // Update totals
  const stEl = document.getElementById(`st-${i}`);
  if (stEl) stEl.textContent = sesterces;
  const vvpEl = document.getElementById(`vvp-${i}`);
  if (vvpEl) vvpEl.textContent = vp;
  const headerVp = document.getElementById(`vp-vesta-${i}`);
  if (headerVp) headerVp.textContent = `${vp} VP`;
}

function refreshSimplePlayer(i, catId) {
  const p = state.currentGame.players[i];
  const game = GAMES[state.currentGame.gameId];
  const cat = game.categories.find(c => c.id === catId);
  if (!cat) return;
  const vp = getSimpleVP(p.scores, cat);
  const el = document.getElementById(`vp-${catId}-${i}`);
  if (el) el.textContent = `${vp} VP`;
}

function refreshMinervaPlayer(i) {
  const p = state.currentGame.players[i];
  const vp = getMinervaVP(p.scores);
  const el1 = document.getElementById(`vp-minerva-${i}`);
  if (el1) el1.textContent = `${vp} VP`;
  const el2 = document.getElementById(`vp-minerva-${i}-calc`);
  if (el2) el2.textContent = `= ${vp} VP`;
}

function refreshTotalScores() {
  const cg = state.currentGame;
  const el = document.getElementById('total-scores');
  if (el) el.innerHTML = renderTotalScoresContent(cg.players, cg.gameId);
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

document.addEventListener('click', handleClick);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

render();
