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

const VENUS_CATEGORY = {
  id: 'venus', name: 'VENUS', emoji: '💘', color: '#C94B8B',
  type: 'simple',
  title: 'Goddess of Love',
  rule: '1 VP × (Venus cards + 1 Legatus) × qualifying provinces. Individual: provinces with 2+ of your houses. Team: provinces where both you and your partner have a house.',
  inputLabel: 'Provinces with 2+ of your houses',
  inputLabelTeam: 'Shared provinces (both you and partner have a house)',
  inputUnit: 'provinces',
  cardsUnit: 'Venus cards',
  legateBonus: true,
  vpPer: 1,
  expansion: 'venus'
};

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
    ],
    expansions: {
      venus: {
        name: 'Concordia Venus',
        emoji: '💘',
        description: 'Adds the VENUS god card and the Legatus card (counts for Jupiter, Saturnus & Venus).'
      },
      salsa: {
        name: 'Concordia Salsa',
        emoji: '🧂',
        description: 'Salt cities count as a wildcard for any Minerva specialist card.'
      }
    }
  }
};

const PLAYER_COLORS = ['#1B3A6B', '#B83232', '#2D7D46', '#B8882A', '#6B42A3'];
const MEDALS = ['🥇', '🥈', '🥉'];
const STORE = { history: 'bgs_history', current: 'bgs_current' };

// ═══════════════════════════════════════════════════════════
// EXPANSIONS
// ═══════════════════════════════════════════════════════════

function getEffectiveCategories(gameId, expansions) {
  const game = GAMES[gameId];
  const exps = expansions || [];
  let cats = game.categories.map(c => {
    const cat = { ...c };
    if (exps.includes('venus') && (c.id === 'iuppiter' || c.id === 'saturnus')) cat.legateBonus = true;
    if (exps.includes('salsa') && c.id === 'minerva') cat.saltWildcard = true;
    return cat;
  });
  if (exps.includes('venus')) cats.push(VENUS_CATEGORY);
  return cats;
}

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
  const cards = Math.max(1, parseInt(s.cards) || 1);
  const legate = cat.legateBonus ? 1 : 0;
  return count * (cards + legate) * cat.vpPer;
}

function getMinervaVP(scores, cat) {
  const s = scores.minerva || {};

  // Backward compat: old single-card format { card: 'vintner', houses: '3' }
  if (s.card !== undefined && !MINERVA_CARDS.some(c => s[c.id] !== undefined)) {
    const card = MINERVA_CARDS.find(c => c.id === s.card);
    return card ? (parseInt(s.houses) || 0) * card.vpPer : 0;
  }

  const salt = (cat && cat.saltWildcard) ? (parseInt(s.saltHouses) || 0) : 0;
  return MINERVA_CARDS.reduce((sum, c) => {
    const houses = parseInt(s[c.id]) || 0;
    if (houses === 0) return sum;
    return sum + (houses + salt) * c.vpPer;
  }, 0);
}

function getConcordiaCardVP(scores, game) {
  return (scores.concordia_card && scores.concordia_card.hasCard) ? game.concordiaCardVP : 0;
}

function getCatScore(scores, cat, game) {
  if (cat.type === 'vesta')   return getVestaVP(scores);
  if (cat.type === 'simple')  return getSimpleVP(scores, cat);
  if (cat.type === 'minerva') return getMinervaVP(scores, cat);
  return 0;
}

function getPlayerTotal(player, gameId, expansions) {
  const game = GAMES[gameId];
  const cats = getEffectiveCategories(gameId, expansions);
  return cats.reduce((sum, cat) => sum + getCatScore(player.scores, cat, game), 0)
    + getConcordiaCardVP(player.scores, game);
}

function getRanked(players, gameId, praefectus, expansions) {
  return players
    .map((p, i) => ({ ...p, _index: i, total: getPlayerTotal(p, gameId, expansions) }))
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

function initScores(gameId, expansions) {
  const cats = getEffectiveCategories(gameId, expansions || []);
  const scores = { concordia_card: { hasCard: false } };
  cats.forEach(cat => {
    if (cat.type === 'vesta') {
      scores.vesta = { brick: '', wheat: '', tool: '', wine: '', cloth: '', cash: '' };
    } else if (cat.type === 'simple') {
      scores[cat.id] = { count: '', cards: 1 };
    } else if (cat.type === 'minerva') {
      const m = {};
      MINERVA_CARDS.forEach(c => { m[c.id] = ''; });
      if (cat.saltWildcard) m.saltHouses = '';
      scores.minerva = m;
    }
  });
  return scores;
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
  document.querySelectorAll('.concordia-cb').forEach(el => {
    el.addEventListener('change', onConcordiaCardChange);
  });
  document.querySelectorAll('.praefectus-radio').forEach(el => {
    el.addEventListener('change', onPraefectusChange);
  });
  document.querySelectorAll('.expansion-check').forEach(el => {
    el.addEventListener('change', onExpansionToggle);
  });
  document.querySelectorAll('.venus-mode-radio').forEach(el => {
    el.addEventListener('change', onVenusModeChange);
  });
  document.querySelectorAll('.partner-select').forEach(el => {
    el.addEventListener('change', onPartnerChange);
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
  </div>
</div>`;
}

// ── SETUP ────────────────────────────────────────────────────

function renderPartnerAssignment(players, partners) {
  const rows = players.map((p, i) => {
    const partnerIdx = partners[i] ?? '';
    const options = players
      .map((other, j) => {
        if (j === i) return '';
        return `<option value="${j}"${partnerIdx === j ? ' selected' : ''}>${h(other.name || `Player ${j + 1}`)}</option>`;
      }).join('');
    return `
<div class="partner-row">
  <div class="player-dot player-dot-sm" style="background:${pc(i)}">${i + 1}</div>
  <span class="partner-label">${h(p.name || `Player ${i + 1}`)}</span>
  <span class="partner-arrow">↔</span>
  <select class="select-input partner-select" data-player="${i}">
    <option value="">Select partner…</option>
    ${options}
  </select>
</div>`;
  }).join('');
  return `<div class="partner-assignments">${rows}</div>`;
}

function renderSetup() {
  const game = GAMES[state.selectedGameId];
  const sd = state.setupData;
  const count = sd.playerCount;
  const exps = sd.expansions || [];
  const vm = sd.venusMode || 'individual';
  const partners = sd.partners || {};

  const countBtns = Array.from({ length: game.maxPlayers - game.minPlayers + 1 }, (_, i) => {
    const n = game.minPlayers + i;
    return `<button class="count-btn${count === n ? ' active' : ''}" data-action="setCount" data-n="${n}">${n}</button>`;
  }).join('');

  const players = Array.from({ length: count }, (_, i) => ({ name: sd.names[i] || `Player ${i + 1}` }));

  const nameInputs = players.map((p, i) => `
<div class="name-row">
  <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
  <input class="text-input player-name-input" type="text"
    data-pi="${i}" maxlength="20"
    placeholder="Player ${i + 1}"
    value="${h(sd.names[i] || '')}">
</div>`).join('');

  let expansionSection = '';
  if (game.expansions && Object.keys(game.expansions).length > 0) {
    const expansionItems = Object.entries(game.expansions).map(([id, exp]) => `
<label class="expansion-item${exps.includes(id) ? ' active' : ''}">
  <input type="checkbox" class="expansion-check" value="${id}"${exps.includes(id) ? ' checked' : ''}>
  <span class="expansion-emoji">${exp.emoji}</span>
  <div class="expansion-text">
    <span class="expansion-name">${h(exp.name)}</span>
    <span class="expansion-desc">${h(exp.description)}</span>
  </div>
</label>`).join('');

    const venusPartnerSection = (vm === 'team' && count >= 4)
      ? renderPartnerAssignment(players, partners)
      : '';

    const venusOptions = exps.includes('venus') ? `
<div class="venus-options">
  <div class="form-label">Venus mode</div>
  <div class="venus-mode-row">
    <label class="venus-mode-option${vm !== 'team' ? ' active' : ''}">
      <input type="radio" class="venus-mode-radio" name="venusMode" value="individual"${vm !== 'team' ? ' checked' : ''}>
      Individual
    </label>
    <label class="venus-mode-option${vm === 'team' ? ' active' : ''}">
      <input type="radio" class="venus-mode-radio" name="venusMode" value="team"${vm === 'team' ? ' checked' : ''}>
      Team / Couples
    </label>
  </div>
  ${venusPartnerSection}
</div>` : '';

    expansionSection = `
<div class="form-section">
  <div class="form-label">Expansions</div>
  <div class="expansion-list">${expansionItems}</div>
  ${venusOptions}
</div>`;
  }

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
    ${expansionSection}
    <button class="btn btn-primary btn-lg" data-action="startGame">Start Game</button>
  </div>
</div>`;
}

// ── SCORING ──────────────────────────────────────────────────

function getScoringTabs(game, expansions) {
  const cats = getEffectiveCategories(game.id, expansions);
  return [
    ...cats.map(c => ({ id: c.id, emoji: c.emoji, label: c.name })),
    { id: 'finish', emoji: '✓', label: 'Finish' }
  ];
}

function renderScoring() {
  const cg = state.currentGame;
  const game = GAMES[cg.gameId];
  const players = cg.players;
  const expansions = cg.expansions || [];
  const tabs = getScoringTabs(game, expansions);
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
    const cats = getEffectiveCategories(cg.gameId, expansions);
    const cat = cats.find(c => c.id === activeTab);
    if (cat) {
      if (cat.type === 'vesta')   tabContent = renderVestaSection(players, cat);
      if (cat.type === 'simple')  tabContent = renderSimpleSection(players, cat, cg);
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
      ${renderTotalScoresContent(players, cg.gameId, expansions)}
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

function renderSimpleSection(players, cat, cg) {
  const cards = players.map((p, i) => {
    const s = p.scores[cat.id] || {};
    const count = s.count ?? '';
    const cardsVal = s.cards ?? 1;
    const vp = getSimpleVP(p.scores, cat);

    const countLabel = (cat.id === 'venus' && cg && cg.venusMode === 'team')
      ? cat.inputLabelTeam
      : cat.inputLabel;
    const legateChip = cat.legateBonus
      ? `<span class="legate-chip">+1 Legatus</span>`
      : '';

    return `
<div class="simple-player-card">
  <div class="vplayer-header">
    <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
    <span class="vplayer-name">${h(p.name)}</span>
    <span class="vplayer-vp" id="vp-${cat.id}-${i}">${vp} VP</span>
  </div>
  <div class="simple-inputs-h">
    <div class="simple-input-col">
      <label class="ig-label">${h(countLabel)}</label>
      <div class="simple-input-field">
        <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
          data-type="count" data-player="${i}" data-cat="${cat.id}"
          value="${h(count)}" placeholder="0">
        <span class="input-unit">${h(cat.inputUnit)}</span>
      </div>
    </div>
    <span class="simple-times">×</span>
    <div class="simple-input-col">
      <label class="ig-label">${h(cat.cardsUnit)}${legateChip}</label>
      <div class="simple-input-field">
        <input class="num-input num-input-sm" type="number" inputmode="numeric" min="1"
          data-type="cards" data-player="${i}" data-cat="${cat.id}"
          value="${h(cardsVal)}" placeholder="1">
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
  const playerCards = players.map((p, i) => {
    const s = p.scores.minerva || {};
    const vp = getMinervaVP(p.scores, cat);

    const cardRows = MINERVA_CARDS.map(c => {
      const houses = s[c.id] ?? '';
      return `
<div class="minerva-card-row">
  <div class="minerva-card-info">
    <span class="minerva-card-name">${c.name}</span>
    <span class="minerva-card-city">${c.city} · ${c.vpPer} VP/house</span>
  </div>
  <div class="simple-input-field">
    <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
      data-type="minerva-card-houses" data-player="${i}" data-card="${c.id}"
      value="${h(houses)}" placeholder="0">
    <span class="input-unit">houses</span>
  </div>
</div>`;
    }).join('');

    const saltRow = cat.saltWildcard ? `
<div class="minerva-salt-row">
  <label class="ig-label">🧂 Salt city houses (wildcard — counts for each card you own)</label>
  <div class="simple-input-field">
    <input class="num-input num-input-sm" type="number" inputmode="numeric" min="0"
      data-type="minerva-salt" data-player="${i}"
      value="${h(s.saltHouses ?? '')}" placeholder="0">
    <span class="input-unit">houses</span>
  </div>
</div>` : '';

    return `
<div class="minerva-player-card">
  <div class="vplayer-header">
    <div class="player-dot" style="background:${pc(i)}">${i + 1}</div>
    <span class="vplayer-name">${h(p.name)}</span>
    <span class="vplayer-vp" id="vp-minerva-${i}">${vp} VP</span>
  </div>
  <div class="minerva-inputs">
    ${cardRows}
    ${saltRow}
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

function renderTotalScoresContent(players, gameId, expansions) {
  const praefectus = state.currentGame?.praefectusPlayer ?? null;
  const ranked = getRanked(players, gameId, praefectus, expansions);
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

function buildBreakdownDetail(cat, scores, expansions) {
  if (cat.type === 'vesta') {
    return `${getVestaSestertii(scores)}🪙 ÷ 10`;
  } else if (cat.type === 'simple') {
    const s = scores[cat.id] || {};
    const cnt = parseInt(s.count) || 0;
    const cds = Math.max(1, parseInt(s.cards) || 1);
    const legate = cat.legateBonus ? 1 : 0;
    return legate
      ? `${cnt} × (${cds}+1) cards × ${cat.vpPer}`
      : `${cnt} × ${cds} cards × ${cat.vpPer}`;
  } else if (cat.type === 'minerva') {
    const s = scores.minerva || {};
    // Backward compat: old format { card, houses }
    if (s.card !== undefined && !MINERVA_CARDS.some(c => s[c.id] !== undefined)) {
      const card = MINERVA_CARDS.find(c => c.id === s.card);
      return card ? `${s.houses || 0} × ${card.vpPer} (${card.name})` : '—';
    }
    const salt = cat.saltWildcard ? (parseInt(s.saltHouses) || 0) : 0;
    const parts = MINERVA_CARDS
      .filter(c => (parseInt(s[c.id]) || 0) > 0)
      .map(c => {
        const houses = parseInt(s[c.id]) || 0;
        return salt > 0
          ? `${c.name}: (${houses}+${salt}s)×${c.vpPer}`
          : `${c.name}: ${houses}×${c.vpPer}`;
      });
    return parts.length > 0 ? parts.join(', ') : '—';
  }
  return '';
}

function renderResults() {
  const cg = state.currentGame;
  const game = GAMES[cg.gameId];
  const expansions = cg.expansions || [];
  const praefectus = cg.praefectusPlayer ?? null;
  const ranked = getRanked(cg.players, game.id, praefectus, expansions);
  const cats = getEffectiveCategories(cg.gameId, expansions);
  const venusMode = cg.venusMode || 'individual';
  const partners = cg.partners || {};

  const podium = ranked.map((p, rank) => {
    const partnerIdx = partners[p._index];
    const partnerName = (venusMode === 'team' && partnerIdx !== undefined)
      ? (cg.players[partnerIdx]?.name || `Player ${partnerIdx + 1}`)
      : null;
    return `
<div class="podium-item${rank === 0 ? ' winner' : ''}">
  <div class="pod-medal">${MEDALS[rank] ?? '#' + (rank + 1)}</div>
  <div class="pod-dot" style="background:${pc(p._index)}">${p._index + 1}</div>
  <div class="pod-name">${h(p.name)}${partnerName ? `<div class="pod-partner">&amp; ${h(partnerName)}</div>` : ''}</div>
  <div class="pod-total">${p.total}</div>
</div>`;
  }).join('');

  // Detect ties involving praefectus
  let tieNote = '';
  if (ranked.length >= 2 && ranked[0].total === ranked[1].total && praefectus !== null) {
    const winner = ranked[0];
    tieNote = `<div class="tie-note">🤝 Tie broken by PRÆFECTUS MAGNUS — ${h(winner.name)} wins</div>`;
  }

  const breakdowns = ranked.map(p => {
    const rows = cats.map(cat => {
      const score = getCatScore(p.scores, cat, game);
      const detail = buildBreakdownDetail(cat, p.scores, expansions);
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
    const ranked = getRanked(g.players, g.gameId, g.praefectusPlayer ?? null, g.expansions);
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
  const expansions = saved.expansions || [];
  const ranked = getRanked(saved.players, gd.id, saved.praefectusPlayer ?? null, expansions);
  const cats = getEffectiveCategories(gd.id, expansions);
  const date = new Date(saved.completedAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const breakdowns = ranked.map((p, rank) => {
    const rows = cats.map(cat => {
      const score = getCatScore(p.scores, cat, gd);
      const detail = buildBreakdownDetail(cat, p.scores, expansions);
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
      state.setupData = {
        playerCount: Math.min(4, game.maxPlayers),
        names: [],
        expansions: [],
        venusMode: 'individual',
        partners: {}
      };
      go('setup');
    },

    setCount: () => {
      state.setupData.playerCount = parseInt(d.n);
      render();
    },

    startGame: () => {
      if (state.currentGame && !confirm('This will replace your current in-progress game. Continue?')) return;
      const { playerCount, names, expansions, venusMode, partners } = state.setupData;
      state.currentGame = {
        gameId: state.selectedGameId,
        expansions: expansions || [],
        venusMode: venusMode || 'individual',
        partners: partners || {},
        players: Array.from({ length: playerCount }, (_, i) => ({
          name: (names[i] || '').trim() || `Player ${i + 1}`,
          scores: initScores(state.selectedGameId, expansions)
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
  const el = e.target;
  const { type, player, good, cat, card } = el.dataset;
  const val = el.value;
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
  } else if (type === 'minerva-card-houses') {
    if (!p.scores.minerva) p.scores.minerva = {};
    p.scores.minerva[card] = val;
    refreshMinervaPlayer(i);
  } else if (type === 'minerva-salt') {
    if (!p.scores.minerva) p.scores.minerva = {};
    p.scores.minerva.saltHouses = val;
    refreshMinervaPlayer(i);
  }

  persistCurrent();
  refreshTotalScores();
}

function onExpansionToggle(e) {
  const id = e.target.value;
  const checked = e.target.checked;
  if (!state.setupData.expansions) state.setupData.expansions = [];
  if (checked) {
    if (!state.setupData.expansions.includes(id)) state.setupData.expansions.push(id);
  } else {
    state.setupData.expansions = state.setupData.expansions.filter(x => x !== id);
  }
  render();
}

function onVenusModeChange(e) {
  state.setupData.venusMode = e.target.value;
  render();
}

function onPartnerChange(e) {
  const playerIdx = parseInt(e.target.dataset.player);
  const partnerIdx = e.target.value === '' ? undefined : parseInt(e.target.value);
  if (!state.setupData.partners) state.setupData.partners = {};
  if (partnerIdx === undefined) {
    delete state.setupData.partners[playerIdx];
  } else {
    state.setupData.partners[playerIdx] = partnerIdx;
  }
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
  const cg = state.currentGame;
  const cats = getEffectiveCategories(cg.gameId, cg.expansions);
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;
  const vp = getSimpleVP(p.scores, cat);
  const el = document.getElementById(`vp-${catId}-${i}`);
  if (el) el.textContent = `${vp} VP`;
}

function refreshMinervaPlayer(i) {
  const p = state.currentGame.players[i];
  const cg = state.currentGame;
  const cats = getEffectiveCategories(cg.gameId, cg.expansions);
  const cat = cats.find(c => c.type === 'minerva');
  const vp = getMinervaVP(p.scores, cat);
  const el = document.getElementById(`vp-minerva-${i}`);
  if (el) el.textContent = `${vp} VP`;
}

function refreshTotalScores() {
  const cg = state.currentGame;
  const el = document.getElementById('total-scores');
  if (el) el.innerHTML = renderTotalScoresContent(cg.players, cg.gameId, cg.expansions);
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
