const STORAGE_KEY = 'goodhouse-demo-v1';
const people = [
  { name: 'Alex Morgan', initials: 'A', color: 'sage' },
  { name: 'Maya Chen', initials: 'M', color: 'rose' },
  { name: 'Jordan Lee', initials: 'J', color: 'blue' },
  { name: 'Sam Rivera', initials: 'S', color: 'gold' },
];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const todayIndex = (new Date().getDay() + 6) % 7;
const seed = {
  chores: [
    { id: 'c1', title: 'Take bins to the curb', area: 'Trash & recycling', day: 0, person: 'Alex Morgan', done: false },
    { id: 'c2', title: 'Reset bathroom', area: 'Bathroom', day: 0, person: 'Maya Chen', done: true },
    { id: 'c3', title: 'Wipe kitchen counters', area: 'Kitchen', day: 1, person: 'Jordan Lee', done: false },
    { id: 'c4', title: 'Vacuum shared spaces', area: 'Living room', day: 1, person: 'Sam Rivera', done: false },
    { id: 'c5', title: 'Dishes & sink reset', area: 'Kitchen', day: 2, person: 'Alex Morgan', done: false },
    { id: 'c6', title: 'Take bins to the curb', area: 'Trash & recycling', day: 2, person: 'Maya Chen', done: false },
    { id: 'c7', title: 'Clean bathroom mirror', area: 'Bathroom', day: 3, person: 'Jordan Lee', done: false },
    { id: 'c8', title: 'Bring recycling in', area: 'Trash & recycling', day: 3, person: 'Sam Rivera', done: false },
    { id: 'c9', title: 'Dishes & sink reset', area: 'Kitchen', day: 4, person: 'Maya Chen', done: false },
    { id: 'c10', title: 'Tidy entryway', area: 'Shared spaces', day: 4, person: 'Alex Morgan', done: false },
    { id: 'c11', title: 'Clear out old groceries', area: 'Kitchen', day: 5, person: 'Jordan Lee', done: false },
    { id: 'c12', title: 'Wipe dining table', area: 'Dining area', day: 5, person: 'Sam Rivera', done: false },
    { id: 'c13', title: 'Take bins to the curb', area: 'Trash & recycling', day: 6, person: 'Sam Rivera', done: false },
    { id: 'c14', title: 'Reset living room', area: 'Shared spaces', day: 6, person: 'Maya Chen', done: false },
  ],
  details: [
    { icon: '⌁', label: 'Wi-Fi network', value: 'WillowHouse_WiFi', note: 'Password: greenhouse24' },
    { icon: '⌂', label: 'Property manager', value: 'Dana Whitaker', note: 'dana@cedarhomes.com · (555) 014-2231' },
    { icon: '↻', label: 'Trash & recycling', value: 'Monday morning', note: 'Bins go out Sunday after 7 pm' },
    { icon: '$', label: 'Rent due', value: '1st of each month', note: 'Lease ends August 31, 2027' },
    { icon: '⚡', label: 'Breaker box', value: 'Hallway closet', note: 'Top panel, labeled “Unit 3”' },
    { icon: '✚', label: 'Water shutoff', value: 'Basement utility room', note: 'Turn red valve clockwise' },
  ],
  rules: [
    { text: 'Quiet hours are 10 pm–8 am on weeknights.', group: 'Shared spaces', signed: 4 },
    { text: 'Give the bathroom a 20-minute reset after you use it.', group: 'Bathroom', signed: 4 },
    { text: 'Ask before inviting overnight guests; give the house a heads-up.', group: 'Guests', signed: 4 },
    { text: 'Shared dishes get washed or loaded before bed.', group: 'Kitchen', signed: 4 },
    { text: 'Keep personal items out of the entryway.', group: 'Shared spaces', signed: 4 },
  ],
  flags: [],
  expenses: [
    { id: 'e1', title: 'Electricity', amount: 124.8, paidBy: 'Maya Chen', date: 'Nov 8', kind: 'utility' },
    { id: 'e2', title: 'Internet', amount: 68, paidBy: 'Alex Morgan', date: 'Nov 3', kind: 'utility' },
    { id: 'e3', title: 'Cleaning supplies', amount: 32.4, paidBy: 'Sam Rivera', date: 'Nov 1', kind: 'household' },
  ],
  photos: [],
  repairs: [
    { text: 'Kitchen faucet is dripping slowly', note: 'Logged by Jordan · Nov 10 · Waiting on property manager', status: 'Open' },
    { text: 'Hallway light bulb replaced', note: 'Logged by Sam · Nov 2', status: 'Done' },
  ],
  activities: [
    { text: 'Maya reset the bathroom', time: 'Yesterday · 6:42 pm', icon: '✓' },
    { text: 'Rent reminder is set for the 1st', time: 'Tuesday · 9:15 am', icon: '$' },
    { text: 'Your house agreement was renewed', time: 'Nov 1 · 8:06 pm', icon: '✳' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return clone(seed);
    return { ...clone(seed), ...JSON.parse(saved) };
  } catch {
    return clone(seed);
  }
}

let state = loadState();
let currentView = 'home';
const pageContent = document.querySelector('#pageContent');
const modalRoot = document.querySelector('#modalRoot');
const toastRoot = document.querySelector('#toastRoot');

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast('This browser is out of space. Try removing a few vault photos.');
  }
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function personFor(name) {
  return people.find((person) => person.name === name) || { name: name || 'Housemate', initials: '?', color: 'sage' };
}

function avatar(name, extraClass = '') {
  const person = personFor(name);
  return '<span class="avatar avatar-' + person.color + ' ' + extraClass + '" title="' + escapeHTML(person.name) + '">' + escapeHTML(person.initials) + '</span>';
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function dateLabel() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function weekDate(dayIndex) {
  const date = new Date();
  date.setDate(date.getDate() + dayIndex - todayIndex);
  return String(date.getDate()).padStart(2, '0');
}

function pushActivity(text, icon) {
  const time = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date());
  state.activities.unshift({ text, time, icon });
  state.activities = state.activities.slice(0, 5);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastRoot.append(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function choreRow(chore) {
  const assigned = personFor(chore.person);
  return '<div class="chore-row">' +
    '<button class="chore-check ' + (chore.done ? 'done' : '') + '" data-action="toggle-chore" data-id="' + chore.id + '" aria-label="' + (chore.done ? 'Mark ' + escapeHTML(chore.title) + ' incomplete' : 'Mark ' + escapeHTML(chore.title) + ' complete') + '">' + (chore.done ? '✓' : '') + '</button>' +
    '<div><div class="chore-name">' + escapeHTML(chore.title) + '</div><div class="chore-meta">' + escapeHTML(chore.area) + '</div></div>' +
    '<span class="person-chip">' + avatar(chore.person) + escapeHTML(assigned.name.split(' ')[0]) + '</span>' +
    '<div class="row-actions">' + (chore.done ? '<span class="done-label">Done</span>' : '<button class="flag-link" data-action="flag-chore" data-id="' + chore.id + '">Flag a miss</button>') + '</div>' +
    '</div>';
}

function pageHeading(title, description, action = '') {
  return '<div class="page-heading"><div><h1>' + title + '</h1><p>' + description + '</p></div>' + action + '</div>';
}

function renderHome() {
  const todaysChores = state.chores.filter((chore) => chore.day === todayIndex);
  const pendingToday = todaysChores.filter((chore) => !chore.done).length;
  const totalSpend = state.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const balances = calculateBalances();
  const biggestCredit = people.slice().sort((a, b) => balances[b.name] - balances[a.name])[0];
  const alexBalance = balances['Alex Morgan'] || 0;
  const flagActivity = state.flags[0];
  const activity = flagActivity
    ? [{ text: flagActivity.anonymous ? 'A housemate flagged ' + flagActivity.chore : personFor(flagActivity.reportedBy).name.split(' ')[0] + ' flagged ' + flagActivity.chore, time: flagActivity.time, icon: '!' }, ...state.activities].slice(0, 3)
    : state.activities.slice(0, 3);
  const todayRows = todaysChores.length
    ? todaysChores.map(choreRow).join('')
    : '<div class="empty-state">No chores on the schedule today. Enjoy the breathing room.</div>';

  return '<section class="welcome-card">' +
      '<div class="welcome-copy"><span class="eyebrow">A LITTLE MORE IN SYNC</span><h1>Home feels better<br>when it works for everyone.</h1><p>Your house, your rhythm. The small stuff is organized so you can get on with living together.</p><button class="button" data-view="chores">See this week’s rhythm <span aria-hidden="true">→</span></button></div>' +
      '<div class="welcome-art" aria-hidden="true"><div class="art-cloud"></div><div class="sun-disc"></div><div class="art-house"><span class="art-window"></span></div><div class="art-leaf"></div></div>' +
    '</section>' +
    '<div class="stats-grid">' +
      '<article class="stat-card"><div class="stat-head">Today’s to-dos <span class="stat-icon">◷</span></div><div class="stat-value">' + (pendingToday || 'All clear') + (pendingToday ? ' <small>left today</small>' : '') + '</div><div class="stat-note">' + (pendingToday ? 'Your house rhythm is on track' : 'Nothing else on the list') + '</div></article>' +
      '<article class="stat-card"><div class="stat-head">House agreement <span class="stat-icon">✳</span></div><div class="stat-value">4 <small>of 4 signed</small></div><div class="stat-note">Renewed for this quarter</div></article>' +
      '<article class="stat-card"><div class="stat-head">This month’s shared costs <span class="stat-icon">$</span></div><div class="stat-value">' + money(totalSpend) + '</div><div class="stat-note">Across ' + state.expenses.length + ' house expenses</div></article>' +
      '<article class="stat-card"><div class="stat-head">Deposit vault <span class="stat-icon">▧</span></div><div class="stat-value">' + state.photos.length + ' <small>' + (state.photos.length === 1 ? 'photo saved' : 'photos saved') + '</small></div><div class="stat-note">Keep move-in proof all together</div></article>' +
    '</div>' +
    '<div class="dashboard-grid">' +
      '<div class="stack">' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">The house rhythm</h2><p class="card-subtitle">' + dateLabel() + ' · small things, shared fairly</p></div><span class="today-pill">' + (pendingToday ? pendingToday + ' UP NEXT' : 'ALL CLEAR') + '</span></div><div class="card-body"><div class="chore-list">' + todayRows + '</div><div style="padding-top:13px"><button class="text-button" data-view="chores">Open the full weekly plan →</button></div></div></section>' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">Little things, taken care of</h2><p class="card-subtitle">A quick pulse on what’s happening at home.</p></div><button class="text-button" data-view="details">House details →</button></div><div class="card-body"><div class="activity-list">' + activity.map((item) => '<div class="activity-item"><span class="activity-icon">' + escapeHTML(item.icon) + '</span><div><p>' + escapeHTML(item.text) + '</p><small>' + escapeHTML(item.time) + '</small></div></div>').join('') + '</div></div></section>' +
      '</div>' +
      '<div class="stack">' +
        '<section class="agreement-card"><h2 class="card-title"><span style="color:#819566">✳</span> Our agreement</h2><p>Five house rules, written together. Good boundaries make the little things easier.</p><div class="agreement-bottom"><div class="mini-avatars">' + people.map((person) => avatar(person.name)).join('') + '</div><small>Everyone’s in</small><button class="text-button" data-view="rules">Read it →</button></div></section>' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">House details</h2><p class="card-subtitle">The things everyone asks for.</p></div><button class="text-button" data-view="details">See all →</button></div><div class="card-body"><div class="house-info-mini"><div class="info-mini"><span>Wi-Fi</span><strong>' + escapeHTML(state.details[0].value) + '</strong></div><div class="info-mini"><span>Rent is due</span><strong>' + escapeHTML(state.details[3].value) + '</strong></div><div class="info-mini"><span>Bins go out</span><strong>' + escapeHTML(state.details[2].value) + '</strong></div><div class="info-mini"><span>Property manager</span><strong>' + escapeHTML(state.details[1].value.split(' ')[0]) + '</strong></div></div></div></section>' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">A fair share</h2><p class="card-subtitle">House expenses, all in one place.</p></div><button class="text-button" data-view="costs">Settle up →</button></div><div class="card-body"><div class="balance-person">' + avatar(biggestCredit.name) + '<span class="person-name">' + escapeHTML(biggestCredit.name.split(' ')[0]) + ' has covered the most so far</span><span class="balance-amount positive">+' + money(Math.max(0, balances[biggestCredit.name])) + '</span></div><div class="balance-person">' + avatar('Alex Morgan') + '<span class="person-name">Your balance</span><span class="balance-amount ' + (alexBalance >= 0 ? 'positive' : 'negative') + '">' + (alexBalance >= 0 ? '+' : '−') + money(Math.abs(alexBalance)) + '</span></div></div></section>' +
      '</div>' +
    '</div>';
}

function renderChores() {
  const sorted = state.chores.slice().sort((a, b) => a.day - b.day);
  const weekCards = dayNames.map((day, dayIndex) => {
    const tasks = sorted.filter((chore) => chore.day === dayIndex);
    return '<article class="day-card ' + (dayIndex === todayIndex ? 'is-today' : '') + '"><div class="day-head"><span>' + day.slice(0, 3).toUpperCase() + '</span><span class="day-number">' + (dayIndex === todayIndex ? 'TODAY' : weekDate(dayIndex)) + '</span></div>' +
      (tasks.length ? tasks.map((chore) => '<button class="day-task ' + (chore.done ? 'done' : '') + '" data-action="toggle-chore" data-id="' + chore.id + '"><strong>' + escapeHTML(chore.title) + '</strong><small>' + escapeHTML(personFor(chore.person).name.split(' ')[0]) + (chore.done ? ' · done' : '') + '</small></button>').join('') : '<div class="day-task muted"><strong>Room to breathe</strong><small>No chores</small></div>') +
      '</article>';
  }).join('');
  const rows = sorted.map((chore) => '<div class="chore-row">' +
    '<button class="chore-check ' + (chore.done ? 'done' : '') + '" data-action="toggle-chore" data-id="' + chore.id + '" aria-label="Toggle ' + escapeHTML(chore.title) + '">' + (chore.done ? '✓' : '') + '</button>' +
    '<div><div class="chore-name">' + escapeHTML(chore.title) + '</div><div class="chore-meta">' + escapeHTML(chore.area) + '</div></div>' +
    '<span class="soft-pill day-cell">' + dayNames[chore.day].slice(0, 3) + '</span>' +
    '<span class="person-chip">' + avatar(chore.person) + escapeHTML(personFor(chore.person).name.split(' ')[0]) + '</span>' +
    '<div class="row-actions">' + (chore.done ? '<span class="done-label">Done</span>' : '<button class="flag-link" data-action="flag-chore" data-id="' + chore.id + '">Flag</button>') + '</div>' +
    '</div>').join('');
  return pageHeading('Chore rhythm', 'A plan the house made together. Mark it done and get back to your day.', '<button class="button" data-action="open-modal" data-modal="add-chore">＋ Add a chore</button>') +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 15px"><div><h2 class="card-title">This week at Willow House</h2><p class="card-subtitle">The tough jobs rotate. Everyone gets a lighter day.</p></div><span class="soft-pill">WEEKLY ROTATION</span></div><div class="week-strip">' + weekCards + '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 12px"><div><h2 class="card-title">Every task, accounted for</h2><p class="card-subtitle">' + state.chores.length + ' small ways to keep the house feeling good.</p></div><button class="text-button" data-action="open-modal" data-modal="flag-chore">Report a missed chore</button></div><div class="chore-table"><div class="table-head"><span></span><span>CHORE</span><span>DAY</span><span>ON IT</span><span></span></div>' + rows + '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 12px"><div><h2 class="card-title">House record</h2><p class="card-subtitle">Timestamped flags stay factual and visible.</p></div><span class="soft-pill">' + state.flags.length + ' FLAGS</span></div>' +
      (state.flags.length ? state.flags.map((flag) => '<div class="activity-item" style="padding:10px 0;border-top:1px solid #f0efe9"><span class="activity-icon">!</span><div><p>' + escapeHTML(flag.chore) + ' · assigned to ' + escapeHTML(personFor(flag.responsible).name.split(' ')[0]) + '</p><small>' + escapeHTML(flag.anonymous ? 'Anonymous housemate' : personFor(flag.reportedBy).name.split(' ')[0]) + ' · ' + escapeHTML(flag.time) + (flag.note ? ' · ' + escapeHTML(flag.note) : '') + '</small></div></div>').join('') : '<div class="empty-state">No flags so far. A good week is a quiet week.</div>') +
    '</section>';
}

function renderDetails() {
  return pageHeading('House details', 'The little details you should never have to dig through a text thread to find.', '<button class="button light" data-action="open-modal" data-modal="edit-details">✎ Edit details</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">Good to know, all in one place.</strong><p>Wi-Fi, rent, the right person to call when something breaks. Visible to everyone in the house.</p></div><span class="soft-pill">SHARED WITH 4 ROOMMATES</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 16px"><div><h2 class="card-title">The house cheat sheet</h2><p class="card-subtitle">Updated by Alex · move-in day</p></div></div><div class="detail-grid">' +
    state.details.map((item, index) => '<article class="detail-tile"><span class="tile-icon">' + escapeHTML(item.icon) + '</span><label>' + escapeHTML(item.label) + '</label><strong>' + escapeHTML(item.value) + '</strong><small>' + escapeHTML(item.note) + '</small>' + (index === 0 ? '<button class="text-button" style="margin-top:9px" data-action="copy" data-copy="' + escapeHTML(item.value + ' · ' + item.note.replace(/^Password: /, '')) + '">Copy Wi-Fi details</button>' : '') + '</article>').join('') +
    '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 14px"><div><h2 class="card-title">If something needs fixing</h2><p class="card-subtitle">Leave a note for the next person who needs it.</p></div><button class="button light small" data-action="open-modal" data-modal="maintenance">＋ Log a repair</button></div><div class="activity-list">' +
      state.repairs.map((repair) => '<div class="activity-item"><span class="activity-icon">' + (repair.status === 'Done' ? '✓' : '⚒') + '</span><div><p>' + escapeHTML(repair.text) + '</p><small>' + escapeHTML(repair.note) + ' · ' + escapeHTML(repair.status) + '</small></div></div>').join('') +
    '</div></section>';
}

function renderVault() {
  const photoCards = state.photos.map((photo) => '<article class="photo-card"><div class="photo-art">' + (photo.image ? '<img src="' + photo.image + '" alt="' + escapeHTML(photo.room) + '" style="width:100%;height:100%;object-fit:cover">' : '<span class="window-shape"></span>') + '</div><div class="photo-info"><strong>' + escapeHTML(photo.room) + '</strong><small>' + escapeHTML(photo.date) + (photo.note ? ' · ' + escapeHTML(photo.note) : '') + '</small></div></article>').join('');
  const uploadTile = '<button class="photo-empty" data-action="open-modal" data-modal="add-photo"><span>＋</span><strong>Add a room photo</strong><small>Save move-in proof in the vault</small></button>';
  return pageHeading('Deposit vault', 'Move-in photos today. Fewer “was that already there?” moments at move-out.', '<button class="button" data-action="open-modal" data-modal="add-photo">＋ Add photos</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">A little proof goes a long way.</strong><p>Take a quick photo, add a note if something was already scuffed, and keep the whole record together. Photos stay in this browser in the demo.</p></div><span class="soft-pill">' + state.photos.length + ' SAVED</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 15px"><div><h2 class="card-title">Move-in walkthrough</h2><p class="card-subtitle">Room by room, timestamped as you go.</p></div><span class="soft-pill">MOVE-IN · NOV 13</span></div><div class="photo-grid">' + (photoCards || '') + uploadTile + '</div></section>' +
    '<section class="agreement-note" style="margin-top:15px"><strong>Before you move out:</strong> add a fresh set of photos here so you can compare the condition side by side. Exporting a landlord-ready report will come later.</section>';
}

function calculateBalances() {
  const balances = Object.fromEntries(people.map((person) => [person.name, 0]));
  state.expenses.forEach((expense) => {
    const share = Number(expense.amount) / people.length;
    people.forEach((person) => { balances[person.name] -= share; });
    balances[expense.paidBy] = (balances[expense.paidBy] || 0) + Number(expense.amount);
  });
  return balances;
}

function renderCosts() {
  const balances = calculateBalances();
  const total = state.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const rows = state.expenses.slice().reverse().map((item) => '<div class="expense-row"><span class="expense-icon">' + (item.kind === 'utility' ? '↯' : '⌂') + '</span><div><strong>' + escapeHTML(item.title) + '</strong><small>Paid by ' + escapeHTML(personFor(item.paidBy).name.split(' ')[0]) + ' · ' + escapeHTML(item.date) + ' · split 4 ways</small></div><span class="expense-amount">' + money(item.amount) + '</span></div>').join('');
  const balanceRows = people.map((person) => {
    const amount = balances[person.name] || 0;
    const sign = amount >= 0 ? '+' : '−';
    return '<div class="balance-person">' + avatar(person.name) + '<span class="person-name">' + escapeHTML(person.name.split(' ')[0]) + (person.name === 'Alex Morgan' ? ' (you)' : '') + '</span><span class="balance-amount ' + (amount >= 0 ? 'positive' : 'negative') + '">' + sign + money(Math.abs(amount)) + '</span></div>';
  }).join('');
  return pageHeading('Shared costs', 'A clear record of the things you split. Money moves between roommates, never through the app.', '<button class="button" data-action="open-modal" data-modal="add-expense">＋ Add an expense</button>') +
    '<div class="balance-grid"><div class="stack"><section class="balance-hero"><span class="eyebrow">SHARED SPENDING THIS MONTH</span><div class="balance-total">' + money(total) + '</div><p>Across ' + state.expenses.length + ' expenses · split evenly between 4</p></section><section class="card page-card"><div class="card-header" style="padding:0 0 13px"><div><h2 class="card-title">Recent expenses</h2><p class="card-subtitle">Every roommate can see who covered what.</p></div></div>' + (rows || '<div class="empty-state">No shared expenses yet.</div>') + '</section></div>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 8px"><div><h2 class="card-title">Who’s up and who’s covered</h2><p class="card-subtitle">Net balance based on expenses logged here.</p></div></div>' + balanceRows + '<div class="agreement-note" style="margin-top:12px">Settle directly with Venmo, Zelle, or whatever your house uses. Goodhouse never holds money.</div></section></div>';
}

function renderRules() {
  const ruleRows = state.rules.map((rule, index) => '<div class="rule-row"><span class="rule-number">' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + escapeHTML(rule.text) + '</strong><small>' + escapeHTML(rule.group) + ' · ' + (rule.signed === 4 ? 'agreed by the house' : 'suggested · review together') + '</small></div><span class="vote-pill">' + (rule.signed === 4 ? '✓ 4/4' : '◷ review') + '</span></div>').join('');
  return pageHeading('Our agreement', 'House rules that came from the people who live here. Equal expectations, clearer conversations.', '<button class="button" data-action="open-modal" data-modal="add-rule">＋ Suggest a rule</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">Written by the house, for the house.</strong><p>Five simple agreements. Revisit them together each quarter or when someone new moves in.</p></div><span class="soft-pill">RENEWED NOV 1</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 13px"><div><h2 class="card-title">Willow House · shared agreement</h2><p class="card-subtitle">Every roommate signed on November 1, 2026.</p></div><button class="text-button" data-action="toast" data-message="The amendment vote flow is coming next.">Amend by vote ↗</button></div><div class="rules-list">' + ruleRows + '</div></section>' +
    '<div class="agreement-note" style="margin-top:15px"><strong>How it works:</strong> Start with a shared set of expectations, talk through the parts that need compromise, and agree together. The app keeps the record; your house makes the rules.</div>';
}

function render() {
  const pageByView = {
    home: renderHome,
    chores: renderChores,
    details: renderDetails,
    vault: renderVault,
    costs: renderCosts,
    rules: renderRules,
  };
  const labels = { home: 'OVERVIEW', chores: 'CHORE RHYTHM', details: 'HOUSE DETAILS', vault: 'DEPOSIT VAULT', costs: 'SHARED COSTS', rules: 'OUR AGREEMENT' };
  currentView = pageByView[currentView] ? currentView : 'home';
  document.querySelector('#currentSection').textContent = labels[currentView];
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === currentView));
  const pending = state.chores.filter((chore) => !chore.done).length;
  document.querySelector('#pendingBadge').textContent = String(pending);
  document.querySelector('#pendingBadge').hidden = pending === 0;
  pageContent.innerHTML = pageByView[currentView]();
}

function openModal(type, choreId = '') {
  const chore = state.chores.find((item) => item.id === choreId);
  const roommateOptions = people.map((person) => '<option value="' + escapeHTML(person.name) + '"' + (chore && chore.person === person.name ? ' selected' : '') + '>' + escapeHTML(person.name) + '</option>').join('');
  let title = '';
  let description = '';
  let fields = '';
  if (type === 'flag-chore') {
    title = 'Flag a missed chore';
    description = 'Keep it factual and kind. This is a nudge, not a verdict.';
    fields = '<div class="field"><label for="flagChore">What was left undone?</label><select id="flagChore" name="choreId">' + state.chores.map((item) => '<option value="' + item.id + '"' + (item.id === choreId ? ' selected' : '') + '>' + escapeHTML(item.title) + ' · ' + dayNames[item.day] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="responsible">Who was assigned?</label><select id="responsible" name="responsible">' + roommateOptions + '</select></div>' +
      '<div class="field"><label for="flagNote">Add context (optional)</label><textarea id="flagNote" name="note" placeholder="A quick detail can help clear things up."></textarea></div>' +
      '<label class="check-row"><input type="checkbox" name="anonymous" checked> Keep my name off the flag</label>';
  } else if (type === 'add-chore') {
    title = 'Add to the house rhythm';
    description = 'Make the task clear, and choose a day and roommate.';
    fields = '<div class="field"><label for="choreTitle">Chore</label><input id="choreTitle" name="title" required placeholder="e.g. Wipe down the stovetop"></div>' +
      '<div class="form-row"><div class="field"><label for="choreArea">Area</label><input id="choreArea" name="area" placeholder="Kitchen"></div><div class="field"><label for="choreDay">Day</label><select id="choreDay" name="day">' + dayNames.map((day, index) => '<option value="' + index + '"' + (index === todayIndex ? ' selected' : '') + '>' + day + '</option>').join('') + '</select></div></div>' +
      '<div class="field"><label for="chorePerson">Who’s on it?</label><select id="chorePerson" name="person">' + people.map((person) => '<option value="' + escapeHTML(person.name) + '">' + escapeHTML(person.name) + '</option>').join('') + '</select></div>';
  } else if (type === 'add-rule') {
    title = 'Suggest a house rule';
    description = 'Your house reviews it together before it becomes part of the agreement.';
    fields = '<div class="field"><label for="ruleText">What would make living together easier?</label><textarea id="ruleText" name="text" required placeholder="Say it in your own words."></textarea></div><div class="field"><label for="ruleGroup">Area</label><select id="ruleGroup" name="group"><option>Shared spaces</option><option>Kitchen</option><option>Bathroom</option><option>Guests</option><option>Quiet hours</option><option>Other</option></select></div>';
  } else if (type === 'add-expense') {
    title = 'Log a shared expense';
    description = 'Record who paid. The house can settle up directly.';
    fields = '<div class="field"><label for="expenseTitle">What was it for?</label><input id="expenseTitle" name="title" required placeholder="e.g. Water bill"></div><div class="form-row"><div class="field"><label for="expenseAmount">Total amount</label><input id="expenseAmount" name="amount" required type="number" min="0.01" step="0.01" placeholder="0.00"></div><div class="field"><label for="expenseDate">Paid by</label><select id="expensePayer" name="paidBy">' + people.map((person) => '<option value="' + escapeHTML(person.name) + '">' + escapeHTML(person.name) + '</option>').join('') + '</select></div></div>';
  } else if (type === 'add-photo') {
    title = 'Add a room photo';
    description = 'A timestamped photo and a short note can save a lot of move-out stress.';
    fields = '<div class="field"><label for="photoFile">Choose a photo</label><input id="photoFile" name="file" type="file" accept="image/*" required></div><div class="field"><label for="photoRoom">Room</label><select id="photoRoom" name="room"><option>Living room</option><option>Kitchen</option><option>Bathroom</option><option>Bedroom</option><option>Entryway</option><option>Other</option></select></div><div class="field"><label for="photoNote">Condition note (optional)</label><input id="photoNote" name="note" placeholder="e.g. Small scratch already on the door"></div>';
  } else if (type === 'edit-details') {
    title = 'Update house details';
    description = 'For now, this demo keeps the details editable on this device.';
    fields = '<div class="field"><label for="wifiValue">Wi-Fi network</label><input id="wifiValue" name="wifiValue" value="' + escapeHTML(state.details[0].value) + '"></div><div class="field"><label for="wifiPassword">Wi-Fi password</label><input id="wifiPassword" name="wifiPassword" value="' + escapeHTML(state.details[0].note.replace(/^Password: /, '')) + '"></div><div class="field"><label for="rentDue">Rent due</label><input id="rentDue" name="rentDue" value="' + escapeHTML(state.details[3].value) + '"></div>';
  } else if (type === 'maintenance') {
    title = 'Log a repair';
    description = 'Keep the status visible so nobody has to ask twice.';
    fields = '<div class="field"><label for="repairText">What needs attention?</label><input id="repairText" name="text" required placeholder="e.g. The hallway light is out"></div><div class="field"><label for="repairNote">Helpful details</label><textarea id="repairNote" name="note" placeholder="Where it is, what you tried, or who you contacted."></textarea></div>';
  }
  modalRoot.innerHTML = '<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><h2 id="modalTitle">' + title + '</h2><p>' + description + '</p></div><button class="close-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><form class="form-grid" data-modal-form="' + type + '">' + fields + '<div class="modal-actions"><button class="button light" type="button" data-action="close-modal">Cancel</button><button class="button" type="submit">' + (type === 'flag-chore' ? 'Log gentle nudge' : type === 'add-photo' ? 'Save photo' : type === 'add-rule' ? 'Send for house review' : type === 'edit-details' ? 'Save details' : type === 'maintenance' ? 'Log repair' : 'Save') + '</button></div></form></section></div>';
  modalRoot.querySelector('input, select, textarea')?.focus();
}

async function compressImage(file) {
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
  const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.76);
}

function handleAction(event) {
  const viewButton = event.target.closest('[data-view]');
  if (viewButton) {
    event.preventDefault();
    currentView = viewButton.dataset.view;
    render();
    return;
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const { action, id } = actionButton.dataset;
  if (action === 'toggle-chore') {
    const chore = state.chores.find((item) => item.id === id);
    if (!chore) return;
    chore.done = !chore.done;
    pushActivity(chore.person.split(' ')[0] + (chore.done ? ' finished ' : ' reopened ') + chore.title.toLowerCase(), chore.done ? '✓' : '◷');
    saveState();
    render();
    showToast(chore.done ? 'Nice. One less thing to think about.' : 'Added back to the list.');
  } else if (action === 'flag-chore') {
    openModal('flag-chore', id || '');
  } else if (action === 'open-modal') {
    openModal(actionButton.dataset.modal);
  } else if (action === 'close-modal') {
    modalRoot.innerHTML = '';
  } else if (action === 'backdrop-close' && event.target === actionButton) {
    modalRoot.innerHTML = '';
  } else if (action === 'toast') {
    showToast(actionButton.dataset.message);
  } else if (action === 'copy') {
    const value = actionButton.dataset.copy;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(() => showToast('Wi-Fi details copied.')).catch(() => showToast(value));
    } else {
      showToast(value);
    }
  }
}

async function handleSubmit(event) {
  const form = event.target.closest('[data-modal-form]');
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const type = form.dataset.modalForm;
  if (type === 'flag-chore') {
    const chore = state.chores.find((item) => item.id === data.get('choreId'));
    if (!chore) return;
    const report = {
      id: 'f' + Date.now(),
      chore: chore.title,
      responsible: String(data.get('responsible')),
      reportedBy: 'Alex Morgan',
      anonymous: data.get('anonymous') === 'on',
      note: String(data.get('note') || '').trim(),
      time: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date()),
    };
    state.flags.unshift(report);
    state.flags = state.flags.slice(0, 20);
    pushActivity('A gentle nudge was logged about ' + chore.title.toLowerCase(), '!');
    showToast('Flag saved to the house record.');
  } else if (type === 'add-chore') {
    state.chores.push({ id: 'c' + Date.now(), title: String(data.get('title')).trim(), area: String(data.get('area') || 'House').trim(), day: Number(data.get('day')), person: String(data.get('person')), done: false });
    pushActivity('A new chore was added to the house rhythm', '◷');
    showToast('Added to the house rhythm.');
  } else if (type === 'add-rule') {
    state.rules.push({ text: String(data.get('text')).trim(), group: String(data.get('group')), signed: 0 });
    pushActivity('A new house rule was suggested for review', '✳');
    showToast('Suggestion added for the house to review.');
  } else if (type === 'add-expense') {
    const amount = Number(data.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) return showToast('Enter an amount greater than zero.');
    state.expenses.push({ id: 'e' + Date.now(), title: String(data.get('title')).trim(), amount, paidBy: String(data.get('paidBy')), date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date()), kind: 'household' });
    pushActivity('A shared expense was logged: ' + String(data.get('title')).trim(), '$');
    showToast('Expense added. Balances updated.');
  } else if (type === 'add-photo') {
    const file = data.get('file');
    if (!file || !file.size) return showToast('Choose an image first.');
    try {
      const image = await compressImage(file);
      state.photos.unshift({ id: 'p' + Date.now(), room: String(data.get('room')), note: String(data.get('note') || '').trim(), date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()), image });
      pushActivity('A move-in photo was added to the deposit vault', '▧');
      showToast('Saved to this browser’s deposit vault.');
    } catch {
      return showToast('That photo could not be saved. Try another image.');
    }
  } else if (type === 'edit-details') {
    state.details[0].value = String(data.get('wifiValue')).trim();
    state.details[0].note = 'Password: ' + String(data.get('wifiPassword')).trim();
    state.details[3].value = String(data.get('rentDue')).trim();
    pushActivity('House details were updated', '⌂');
    showToast('House details updated.');
  } else if (type === 'maintenance') {
    const repairText = String(data.get('text')).trim();
    state.repairs.unshift({ text: repairText, note: String(data.get('note') || '').trim() || 'Logged today', status: 'Open' });
    pushActivity('Repair logged: ' + repairText, '⚒');
    showToast('Repair added to the house log.');
  }
  saveState();
  modalRoot.innerHTML = '';
  render();
}

document.addEventListener('click', handleAction);
document.addEventListener('submit', handleSubmit);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modalRoot.innerHTML) modalRoot.innerHTML = '';
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // The app still works online if service worker registration is unavailable.
    });
  });
}

render();
