const STORAGE_KEY = 'goodhouse-demo-v1';
const people = [
  { name: 'Alex Morgan', initials: 'A', color: 'sage' },
  { name: 'Maya Chen', initials: 'M', color: 'rose' },
  { name: 'Jordan Lee', initials: 'J', color: 'blue' },
  { name: 'Sam Rivera', initials: 'S', color: 'gold' },
];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const usStates = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
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
  checklist: {
    lease: false,
    utilities: false,
    insurance: false,
    walkthrough: false,
    emergency: false,
    budget: false,
  },
  budget: { security_deposit: 0, first_month_rent: 0, application_fees: 0, utility_setup: 0, moving: 0, emergency_buffer: 0 },
  location: { state: '', city: '' },
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
let currentView = 'coach';
let appConfig = { apiConfigured: false, authConfigured: false, supabaseUrl: '', supabaseAnonKey: '' };
let supabaseClient = null;
let authSession = null;
let activeHousehold = null;
let leaseSummary = null;
let pendingProposalSequence = 0;
const pendingProposals = new Map();
const chatHistory = [];
const pageContent = document.querySelector('#pageContent');
const modalRoot = document.querySelector('#modalRoot');
const toastRoot = document.querySelector('#toastRoot');

async function initializeBackend() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) return updateConnectionLabel();
    appConfig = { ...appConfig, ...await response.json() };
    if (appConfig.authConfigured && window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
      const { data } = await supabaseClient.auth.getSession();
      authSession = data.session;
      if (authSession) await loadHouseholds();
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        authSession = session;
        if (!session) { activeHousehold = null; state = clone(seed); leaseSummary = null; chatHistory.length = 0; }
        else if (event === 'INITIAL_SESSION' && !activeHousehold) await loadHouseholds();
        updateConnectionLabel();
        render();
      });
    }
  } catch {
    // Static local preview remains usable when no API server is running.
  }
  updateConnectionLabel();
  render();
}

function updateConnectionLabel() {
  const label = document.querySelector('#connectionLabel');
  const accountButton = document.querySelector('#accountButton');
  if (!label || !accountButton) return;
  label.textContent = authSession && activeHousehold && appConfig.apiConfigured ? 'HOUSE CO-PILOT READY' : 'LOCAL PREVIEW';
  accountButton.textContent = authSession ? (activeHousehold ? activeHousehold.name : 'Create house') : 'Connect house';
  const houseName = activeHousehold?.name || 'Willow House';
  document.querySelector('#houseNameLabel')?.replaceChildren(document.createTextNode(houseName));
  document.querySelector('#houseCrumb')?.replaceChildren(document.createTextNode(houseName.toUpperCase()));
  const count = authSession && activeHousehold ? Number(state.memberCount || 1) : 4;
  const roommateCount = document.querySelector('#roommateCount');
  if (roommateCount) roommateCount.textContent = authSession && activeHousehold ? count + (count === 1 ? ' member' : ' members') : '4 roommates';
  if (authSession && activeHousehold) document.querySelector('#roommateStack')?.classList.add('connected-house');
  else document.querySelector('#roommateStack')?.classList.remove('connected-house');
  const profileName = document.querySelector('#profileName');
  const profileStatus = document.querySelector('#profileStatus');
  if (profileName) profileName.textContent = authSession?.user?.email?.split('@')[0] || (activeHousehold ? 'House member' : 'Demo roommate');
  if (profileStatus) profileStatus.textContent = authSession && activeHousehold ? 'House member' : authSession ? 'Account connected' : 'Sample household';
}

async function loadHouseholds() {
  if (!authSession) return;
  try {
    const response = await fetch('/api/households', { headers: { Authorization: 'Bearer ' + authSession.access_token } });
    if (!response.ok) throw new Error('Could not load households.');
    const households = await response.json();
    activeHousehold = households[0] || null;
    if (activeHousehold) await loadHouseholdSnapshot();
    else {
      state = clone(seed);
      leaseSummary = null;
    }
  } catch (error) {
    showToast(error.message);
  }
}

async function loadHouseholdSnapshot() {
  if (!activeHousehold || !authSession) return;
  const snapshot = await apiRequest('/api/households/' + activeHousehold.id + '/snapshot');
  state.chores = (snapshot.chores || []).map((row) => ({ id: row.id, title: row.title, area: row.area || 'House', day: Number(row.day || 0), person: row.assigned_to_name || 'Housemate', done: row.status === 'done' }));
  state.expenses = (snapshot.expenses || []).map((row) => ({ id: row.id, title: row.title, amount: Number(row.amount), paidBy: row.paid_by_label || 'Housemate', date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(row.created_at)), kind: row.recurring ? 'utility' : 'household' }));
  state.rules = (snapshot.rules || []).map((row) => ({ id: row.id, text: row.text, group: row.category || 'House', signed: row.status === 'active' ? 4 : 0 }));
  state.details = (snapshot.details || []).map((row) => ({ id: row.id, icon: row.label === 'Wi-Fi network' ? '⌁' : row.label === 'Rent due' ? '$' : '⌂', label: row.label, value: row.value, note: '', sensitivity: row.sensitivity }));
  state.repairs = (snapshot.repairs || []).map((row) => ({ id: row.id, text: row.description, note: [row.note, new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(row.created_at))].filter(Boolean).join(' · '), status: row.status === 'done' ? 'Done' : 'Open' }));
  state.flags = (snapshot.flags || []).map((row) => ({ id: row.id, chore: row.chores?.title || 'Chore', responsible: row.responsible_label, reportedBy: 'Housemate', anonymous: row.is_anonymous, note: row.note, time: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(row.created_at)) }));
  state.photos = (snapshot.photos || []).map((row) => ({ id: row.id, room: row.room, note: row.note, date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(row.created_at)), image: row.image_url }));
  state.checklist = Object.fromEntries(['lease','budget','utilities','insurance','walkthrough','emergency'].map((key) => [key, Boolean(snapshot.checklist?.find((row) => row.item_key === key)?.done)]));
  state.location = { state: activeHousehold.state || '', city: activeHousehold.city || '' };
  state.memberCount = snapshot.memberCount || 1;
  state.budget = { ...seed.budget, ...(snapshot.budget || {}) };
  state.activities = [];
  leaseSummary = snapshot.lease || null;
}

async function persistHouseholdAction(action, args) {
  if (!authSession || !activeHousehold || !appConfig.apiConfigured) return null;
  const result = await apiRequest('/api/households/' + activeHousehold.id + '/actions', { method: 'POST', body: JSON.stringify({ action, arguments: args }) });
  await loadHouseholdSnapshot();
  return result.result;
}

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authSession?.access_token) headers.Authorization = 'Bearer ' + authSession.access_token;
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed.');
  return payload;
}

function inviteToken(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  try { return new URL(text).searchParams.get('invite') || text; }
  catch { return text; }
}

function saveState() {
  if (authSession && activeHousehold && appConfig.apiConfigured) return;
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

function detailValue(label, fallback = 'Add this detail') {
  return state.details.find((item) => item.label.toLowerCase() === label.toLowerCase())?.value || fallback;
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

function renderCopilot() {
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const linked = Boolean(authSession && activeHousehold && appConfig.apiConfigured);
  return '<section class="coach-hero"><div><span class="eyebrow">YOUR FIRST-HOME CO-PILOT</span><h1>' + greeting + '. Let’s make home feel manageable.</h1><p>Ask about your lease, plan your move-in, understand your costs, or figure out the next house task. I’ll work from your household information and show where answers come from.</p></div><div class="coach-status"><span class="status-orbit">✳</span><span>' + (linked ? 'Connected to ' + escapeHTML(activeHousehold.name) : 'Preview mode') + '</span></div></section>' +
    '<div class="coach-layout"><section class="card coach-chat"><div class="chat-head"><div class="assistant-avatar">✳</div><div><strong>Goodhouse guide</strong><small>' + (linked ? 'Connected to your house data' : 'AI connects after setup') + '</small></div><span class="soft-pill">HOUSE CO-PILOT</span></div>' +
      '<div class="chat-thread" id="chatThread"><div class="chat-message assistant-message"><strong>Goodhouse</strong><p>I can help you understand what you signed, plan the first month, and keep the house running. I’ll point to lease pages or official renter resources when I answer.</p><small>' + (linked ? 'Household context is connected.' : 'This preview does not send messages to an AI yet.') + '</small></div></div>' +
      '<form class="chat-composer" id="chatForm"><label class="sr-only" for="chatInput">Ask your home co-pilot</label><textarea id="chatInput" name="message" rows="2" placeholder="Ask about your lease, costs, move-in, or house routines…" required></textarea><button class="button" type="submit" aria-label="Send question">↑</button></form>' +
      '<div class="prompt-row"><button data-action="ask-prompt" data-prompt="What should we take care of before move-in?">Move-in checklist</button><button data-action="ask-prompt" data-prompt="What costs should we expect in our first month?">First-month costs</button><button data-action="ask-prompt" data-prompt="Explain the notice period in our lease.">Explain my lease</button></div>' +
      (!linked ? '<div class="connect-note"><strong>To turn on the real co-pilot:</strong> configure OpenAI and Supabase in the server environment, create or join a house, then ask again. No lease or message is sent from this preview.</div>' : '') +
    '</section><aside class="coach-rail"><section class="card rail-card"><div class="rail-title"><span>▤</span><div><strong>Your lease</strong><small>' + (leaseSummary ? 'Summary ready' : 'Not reviewed yet') + '</small></div></div><p>' + (leaseSummary ? 'I can answer from your saved summary and point to the source page.' : 'Scan your lease to pull out dates, costs, and responsibilities.') + '</p><button class="text-button" data-view="lease">' + (leaseSummary ? 'Open lease guide →' : 'Review a lease →') + '</button></section>' +
      '<section class="card rail-card"><div class="rail-title"><span>$</span><div><strong>First-month money</strong><small>Make the costs visible</small></div></div><p>See up-front cash, recurring bills, and each roommate’s share in one place.</p><button class="text-button" data-view="costs">Build your budget →</button></section>' +
      '<section class="card rail-card"><div class="rail-title"><span>⌂</span><div><strong>Move-in roadmap</strong><small>' + Object.values(state.checklist).filter(Boolean).length + ' of ' + Object.keys(state.checklist).length + ' steps done</small></div></div><p>Utilities, renter’s insurance, condition photos, and the little things people forget.</p><button class="text-button" data-view="movein">See next steps →</button></section></aside></div>' +
    '<section class="coach-principle"><span>✳</span><p><strong>Helpful, not a hall monitor.</strong> Goodhouse can prepare a plan or a message. You choose what gets saved or sent.</p></section>';
}

function renderLease() {
  const selectedState = state.location.state || '';
  const clauseCards = leaseSummary?.clauses?.map((clause) => '<article class="clause-card"><div><strong>' + escapeHTML(clause.heading || clause.topic || 'Lease clause') + '</strong><span>Page ' + escapeHTML(clause.page ?? '—') + '</span></div><blockquote>' + escapeHTML(clause.quote || '') + '</blockquote><p>' + escapeHTML(clause.explanation || clause.plain_english || '') + '</p></article>').join('') || '';
  const terms = leaseSummary?.terms || leaseSummary;
  return pageHeading('Lease, in plain English', 'Know what the document says, what to ask about, and where each answer came from.', '<button class="button light" data-view="movein">Move-in roadmap →</button>') +
    '<div class="lease-grid"><div class="stack"><section class="card page-card"><div class="card-header" style="padding:0 0 14px"><div><h2 class="card-title">Scan a lease</h2><p class="card-subtitle">PDF only. We extract key details and cite the page and clause.</p></div><span class="soft-pill">PRIVATE HOUSE DATA</span></div>' +
      '<form class="lease-upload" id="leaseForm"><label class="upload-drop" for="leaseFile"><span>＋</span><strong>Choose your lease PDF</strong><small>The PDF is sent to this app’s server and OpenAI for analysis. Goodhouse saves the extracted summary, not the original PDF.</small><input id="leaseFile" name="file" type="file" accept="application/pdf,.pdf" required></label><button class="button" type="submit">Scan and explain lease</button><p class="form-status" id="leaseStatus">Upload works after OpenAI and Supabase are configured and you’re connected to a house.</p></form></section>' +
      (leaseSummary ? '<section class="card page-card"><div class="card-header" style="padding:0 0 14px"><div><h2 class="card-title">' + escapeHTML(leaseSummary.filename || 'Lease summary') + '</h2><p class="card-subtitle">Extracted terms · check the source before acting.</p></div><span class="soft-pill">AI SUMMARY</span></div><div class="lease-terms-grid">' +
        [['Rent',terms.rent],['Security deposit',terms.security_deposit],['Lease dates',(terms.start_date || '—') + ' → ' + (terms.end_date || '—')],['Rent due',terms.rent_due],['Late fees',terms.late_fees],['Notice period',terms.notice_period],['Utilities',terms.utilities],['Move-out',terms.move_out]].map(([label,value]) => '<div class="lease-term"><small>' + label + '</small><strong>' + escapeHTML(value || 'Not found in this lease') + '</strong></div>').join('') +
        '</div></section><section class="card page-card"><div class="card-header" style="padding:0 0 12px"><div><h2 class="card-title">Where the answers came from</h2><p class="card-subtitle">Open the original clause before making a decision.</p></div></div>' + (clauseCards || '<div class="empty-state">The scan found no cited clauses to show.</div>') + '</section>' : '') +
      '</div><aside class="stack"><section class="card page-card"><div class="card-header" style="padding:0 0 10px"><div><h2 class="card-title">Local renter resources</h2><p class="card-subtitle">Legal rules depend on where you live.</p></div></div><div class="form-grid"><div class="field"><label for="legalState">State</label><select id="legalState"><option value="">Choose a state</option>' + usStates.map((name) => '<option value="' + escapeHTML(name) + '"' + (selectedState === name ? ' selected' : '') + '>' + escapeHTML(name) + '</option>').join('') + '</select></div><div class="field"><label for="legalCity">City</label><input id="legalCity" value="' + escapeHTML(state.location.city) + '" placeholder="City or county"></div><button class="button light" data-action="save-location">Save location</button></div><div class="legal-source-note"><strong>How guidance works</strong><p>The app separates “your lease says” from “local law may say.” Legal answers should link to current state or local sources and point you to legal aid for disputes.</p><a href="https://www.usa.gov/tenant-rights" target="_blank" rel="noreferrer">Find state tenant resources ↗</a></div></section>' +
      '<section class="agreement-note"><strong>What the AI should not do:</strong> decide if a clause is enforceable, tell you to withhold rent, or send a formal legal notice. It can explain text, show sources, and help prepare questions for a local expert.</section></aside></div>';
}

function renderMoveIn() {
  const items = [
    ['lease','Review your lease dates, rent, fees, and notice requirements.','Lease guide'],
    ['budget','Estimate move-in cash and your first month of shared costs.','Build a budget'],
    ['utilities','Set up internet and confirm who opens utility accounts.','House details'],
    ['insurance','Compare renter’s insurance options and decide what coverage you need.','Learn the basics'],
    ['walkthrough','Photograph every room and note existing wear before unpacking.','Open deposit vault'],
    ['emergency','Find the breaker, water shutoff, landlord contact, and emergency contacts.','House details'],
  ];
  const done = Object.values(state.checklist).filter(Boolean).length;
  return pageHeading('Your first-home roadmap', 'A calm checklist from lease signing through the first month. Take it one step at a time.', '<span class="soft-pill">' + done + ' OF ' + items.length + ' DONE</span>') +
    '<section class="roadmap-banner"><div><span class="eyebrow">MOVE-IN, MADE LESS MYSTERIOUS</span><h2>Small steps now can prevent expensive surprises later.</h2><p>Your co-pilot can read your lease, organize the dates, and help you understand each step.</p></div><span class="roadmap-mark">⌂</span></section>' +
    '<div class="roadmap-grid"><section class="card page-card"><div class="card-header" style="padding:0 0 13px"><div><h2 class="card-title">Before the boxes arrive</h2><p class="card-subtitle">Do the high-value setup while you have time.</p></div></div><div class="roadmap-list">' +
      items.map(([id,text,cta],index) => '<div class="roadmap-item"><button class="chore-check ' + (state.checklist[id] ? 'done' : '') + '" data-action="toggle-checklist" data-id="' + id + '" aria-label="Toggle checklist item">' + (state.checklist[id] ? '✓' : '') + '</button><span class="roadmap-number">' + String(index+1).padStart(2,'0') + '</span><div><strong>' + text + '</strong><button class="text-button" data-view="' + ({'Lease guide':'lease','Build a budget':'costs','House details':'details','Learn the basics':'lease','Open deposit vault':'vault'})[cta] + '">' + cta + ' →</button></div></div>').join('') +
    '</div></section><aside class="stack"><section class="card page-card"><div class="card-header" style="padding:0 0 10px"><div><h2 class="card-title">First-month cash plan</h2><p class="card-subtitle">Know the upfront number before move-in.</p></div></div><p class="money-intro">Include deposits and one-time fees separately from rent and monthly utilities.</p><button class="button light" data-view="costs">Build your estimate →</button></section><section class="card page-card"><div class="card-header" style="padding:0 0 10px"><div><h2 class="card-title">Need a real person?</h2><p class="card-subtitle">Keep official support close.</p></div></div><p class="money-intro">Choose your state and city to find official tenant resources. For a dispute or eviction notice, contact local legal aid or a qualified housing counselor.</p><button class="text-button" data-view="lease">Set your location →</button></section></aside></div>';
}

function renderHome() {
  const isConnected = Boolean(authSession && activeHousehold);
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
  const costPulse = isConnected
    ? '<section class="card"><div class="card-header"><div><h2 class="card-title">Household costs</h2><p class="card-subtitle">Shared records, visible to house members.</p></div><button class="text-button" data-view="costs">Open costs →</button></div><div class="card-body"><div class="balance-person"><span class="person-name">Expenses logged</span><strong>' + state.expenses.length + '</strong></div><div class="balance-person"><span class="person-name">Move-in estimate</span><strong>' + money(Object.values(state.budget || {}).reduce((sum, amount) => sum + Number(amount || 0), 0)) + '</strong></div></div></section>'
    : '<section class="card"><div class="card-header"><div><h2 class="card-title">A fair share</h2><p class="card-subtitle">House expenses, all in one place.</p></div><button class="text-button" data-view="costs">Settle up →</button></div><div class="card-body"><div class="balance-person">' + avatar(biggestCredit.name) + '<span class="person-name">' + escapeHTML(biggestCredit.name.split(' ')[0]) + ' has covered the most so far</span><span class="balance-amount positive">+' + money(Math.max(0, balances[biggestCredit.name])) + '</span></div><div class="balance-person">' + avatar('Alex Morgan') + '<span class="person-name">Your balance</span><span class="balance-amount ' + (alexBalance >= 0 ? 'positive' : 'negative') + '">' + (alexBalance >= 0 ? '+' : '−') + money(Math.abs(alexBalance)) + '</span></div></div></section>';

  return '<section class="welcome-card">' +
      '<div class="welcome-copy"><span class="eyebrow">A LITTLE MORE IN SYNC</span><h1>Home feels better<br>when it works for everyone.</h1><p>Your house, your rhythm. The small stuff is organized so you can get on with living together.</p><button class="button" data-view="chores">See this week’s rhythm <span aria-hidden="true">→</span></button></div>' +
      '<div class="welcome-art" aria-hidden="true"><div class="art-cloud"></div><div class="sun-disc"></div><div class="art-house"><span class="art-window"></span></div><div class="art-leaf"></div></div>' +
    '</section>' +
    '<div class="stats-grid">' +
      '<article class="stat-card"><div class="stat-head">Today’s to-dos <span class="stat-icon">◷</span></div><div class="stat-value">' + (pendingToday || 'All clear') + (pendingToday ? ' <small>left today</small>' : '') + '</div><div class="stat-note">' + (pendingToday ? 'Your house rhythm is on track' : 'Nothing else on the list') + '</div></article>' +
      '<article class="stat-card"><div class="stat-head">House agreement <span class="stat-icon">✳</span></div><div class="stat-value">' + state.rules.length + ' <small>shared rules</small></div><div class="stat-note">Review and update together</div></article>' +
      '<article class="stat-card"><div class="stat-head">Shared costs tracked <span class="stat-icon">$</span></div><div class="stat-value">' + money(totalSpend) + '</div><div class="stat-note">Across ' + state.expenses.length + ' house expenses</div></article>' +
      '<article class="stat-card"><div class="stat-head">Deposit vault <span class="stat-icon">▧</span></div><div class="stat-value">' + state.photos.length + ' <small>' + (state.photos.length === 1 ? 'photo saved' : 'photos saved') + '</small></div><div class="stat-note">Keep move-in proof all together</div></article>' +
    '</div>' +
    '<div class="dashboard-grid">' +
      '<div class="stack">' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">The house rhythm</h2><p class="card-subtitle">' + dateLabel() + ' · small things, shared fairly</p></div><span class="today-pill">' + (pendingToday ? pendingToday + ' UP NEXT' : 'ALL CLEAR') + '</span></div><div class="card-body"><div class="chore-list">' + todayRows + '</div><div style="padding-top:13px"><button class="text-button" data-view="chores">Open the full weekly plan →</button></div></div></section>' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">Little things, taken care of</h2><p class="card-subtitle">A quick pulse on what’s happening at home.</p></div><button class="text-button" data-view="details">House details →</button></div><div class="card-body"><div class="activity-list">' + (activity.length ? activity.map((item) => '<div class="activity-item"><span class="activity-icon">' + escapeHTML(item.icon) + '</span><div><p>' + escapeHTML(item.text) + '</p><small>' + escapeHTML(item.time) + '</small></div></div>').join('') : '<div class="empty-state">House activity will appear here as you use Goodhouse.</div>') + '</div></div></section>' +
      '</div>' +
      '<div class="stack">' +
        '<section class="agreement-card"><h2 class="card-title"><span style="color:#819566">✳</span> Our agreement</h2><p>' + state.rules.length + ' shared expectations. Good boundaries make the little things easier.</p><div class="agreement-bottom"><div class="mini-avatars">' + (authSession && activeHousehold ? '' : people.map((person) => avatar(person.name)).join('')) + '</div><small>' + (authSession && activeHousehold ? state.memberCount + ' household members' : 'Sample household') + '</small><button class="text-button" data-view="rules">Read it →</button></div></section>' +
        '<section class="card"><div class="card-header"><div><h2 class="card-title">House details</h2><p class="card-subtitle">The things everyone asks for.</p></div><button class="text-button" data-view="details">See all →</button></div><div class="card-body"><div class="house-info-mini"><div class="info-mini"><span>Wi-Fi</span><strong>' + escapeHTML(detailValue('Wi-Fi network')) + '</strong></div><div class="info-mini"><span>Rent is due</span><strong>' + escapeHTML(detailValue('Rent due')) + '</strong></div><div class="info-mini"><span>Bins go out</span><strong>' + escapeHTML(detailValue('Trash & recycling')) + '</strong></div><div class="info-mini"><span>Property manager</span><strong>' + escapeHTML(detailValue('Property manager')) + '</strong></div></div></div></section>' +
        costPulse +
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
    '<section class="card page-card"><div class="card-header" style="padding:0 0 15px"><div><h2 class="card-title">This week at ' + escapeHTML(activeHousehold?.name || 'Willow House') + '</h2><p class="card-subtitle">A weekly plan the household can adjust together.</p></div><span class="soft-pill">WEEKLY PLAN</span></div><div class="week-strip">' + weekCards + '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 12px"><div><h2 class="card-title">Every task, accounted for</h2><p class="card-subtitle">' + state.chores.length + ' small ways to keep the house feeling good.</p></div><button class="text-button" data-action="open-modal" data-modal="flag-chore">Report a missed chore</button></div><div class="chore-table"><div class="table-head"><span></span><span>CHORE</span><span>DAY</span><span>ON IT</span><span></span></div>' + rows + '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 12px"><div><h2 class="card-title">House record</h2><p class="card-subtitle">Timestamped flags stay factual and visible.</p></div><span class="soft-pill">' + state.flags.length + ' FLAGS</span></div>' +
      (state.flags.length ? state.flags.map((flag) => '<div class="activity-item" style="padding:10px 0;border-top:1px solid #f0efe9"><span class="activity-icon">!</span><div><p>' + escapeHTML(flag.chore) + ' · assigned to ' + escapeHTML(personFor(flag.responsible).name.split(' ')[0]) + '</p><small>' + escapeHTML(flag.anonymous ? 'Anonymous housemate' : personFor(flag.reportedBy).name.split(' ')[0]) + ' · ' + escapeHTML(flag.time) + (flag.note ? ' · ' + escapeHTML(flag.note) : '') + '</small></div></div>').join('') : '<div class="empty-state">No flags so far. A good week is a quiet week.</div>') +
    '</section>';
}

function renderDetails() {
  return pageHeading('House details', 'The little details you should never have to dig through a text thread to find.', '<button class="button light" data-action="open-modal" data-modal="edit-details">✎ Edit details</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">Good to know, all in one place.</strong><p>Wi-Fi, rent, the right person to call when something breaks. Shared household details appear for every member.</p></div><span class="soft-pill">' + (authSession && activeHousehold ? state.memberCount + ' HOUSEHOLD MEMBERS' : 'LOCAL DEMO') + '</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 16px"><div><h2 class="card-title">The house cheat sheet</h2><p class="card-subtitle">Household information</p></div></div><div class="detail-grid">' +
    (state.details.length ? state.details.map((item) => '<article class="detail-tile"><span class="tile-icon">' + escapeHTML(item.icon) + '</span><label>' + escapeHTML(item.label) + '</label><strong>' + escapeHTML(item.value) + '</strong><small>' + escapeHTML(item.note) + '</small>' + (item.label === 'Wi-Fi network' ? '<button class="text-button" style="margin-top:9px" data-action="copy" data-copy="' + escapeHTML(item.value) + '">Copy Wi-Fi name</button>' : '') + '</article>').join('') : '<div class="empty-state">No house details saved yet. Add only information your household wants to share.</div>') +
    '</div></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 14px"><div><h2 class="card-title">If something needs fixing</h2><p class="card-subtitle">Leave a note for the next person who needs it.</p></div><button class="button light small" data-action="open-modal" data-modal="maintenance">＋ Log a repair</button></div><div class="activity-list">' +
      state.repairs.map((repair) => '<div class="activity-item"><span class="activity-icon">' + (repair.status === 'Done' ? '✓' : '⚒') + '</span><div><p>' + escapeHTML(repair.text) + '</p><small>' + escapeHTML(repair.note) + ' · ' + escapeHTML(repair.status) + '</small></div></div>').join('') +
    '</div></section>';
}

function renderVault() {
  const photoCards = state.photos.map((photo) => '<article class="photo-card"><div class="photo-art">' + (photo.image ? '<img src="' + photo.image + '" alt="' + escapeHTML(photo.room) + '" style="width:100%;height:100%;object-fit:cover">' : '<span class="window-shape"></span>') + '</div><div class="photo-info"><strong>' + escapeHTML(photo.room) + '</strong><small>' + escapeHTML(photo.date) + (photo.note ? ' · ' + escapeHTML(photo.note) : '') + '</small></div></article>').join('');
  const uploadTile = '<button class="photo-empty" data-action="open-modal" data-modal="add-photo"><span>＋</span><strong>Add a room photo</strong><small>Save move-in proof in the vault</small></button>';
  return pageHeading('Deposit vault', 'Move-in photos today. Fewer “was that already there?” moments at move-out.', '<button class="button" data-action="open-modal" data-modal="add-photo">＋ Add photos</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">A little proof goes a long way.</strong><p>Take a quick photo, add a note if something was already scuffed, and keep the whole record together. ' + (authSession && activeHousehold ? 'Photos are stored privately for household members.' : 'Photos stay in this browser in the demo.') + '</p></div><span class="soft-pill">' + state.photos.length + ' SAVED</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 15px"><div><h2 class="card-title">Move-in walkthrough</h2><p class="card-subtitle">Room by room, timestamped as you go.</p></div><span class="soft-pill">' + (authSession && activeHousehold ? 'SHARED VAULT' : 'LOCAL PREVIEW') + '</span></div><div class="photo-grid">' + (photoCards || '') + uploadTile + '</div></section>' +
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
  const memberCount = Math.max(1, Number(state.memberCount || 4));
  const rows = state.expenses.slice().reverse().map((item) => '<div class="expense-row"><span class="expense-icon">' + (item.kind === 'utility' ? '↯' : '⌂') + '</span><div><strong>' + escapeHTML(item.title) + '</strong><small>Paid by ' + escapeHTML((item.paidBy || 'Housemate').split(' ')[0]) + ' · ' + escapeHTML(item.date) + ' · split ' + memberCount + ' ways</small></div><span class="expense-amount">' + money(item.amount) + '</span></div>').join('');
  const balanceRows = people.map((person) => {
    const amount = balances[person.name] || 0;
    const sign = amount >= 0 ? '+' : '−';
    return '<div class="balance-person">' + avatar(person.name) + '<span class="person-name">' + escapeHTML(person.name.split(' ')[0]) + (person.name === 'Alex Morgan' ? ' (you)' : '') + '</span><span class="balance-amount ' + (amount >= 0 ? 'positive' : 'negative') + '">' + sign + money(Math.abs(amount)) + '</span></div>';
  }).join('');
  const budgetItems = [
    ['security_deposit','Security deposit'], ['first_month_rent','First month’s rent'], ['application_fees','Application and move-in fees'],
    ['utility_setup','Utility setup'], ['moving','Moving costs'], ['emergency_buffer','Starter emergency cushion'],
  ];
  const estimatedMoveIn = budgetItems.reduce((sum, [key]) => sum + Number(state.budget?.[key] || 0), 0);
  const budgetFields = budgetItems.map(([key,label]) => '<div class="field"><label for="budget-' + key + '">' + label + '</label><input id="budget-' + key + '" name="' + key + '" type="number" min="0" max="100000" step="0.01" value="' + Number(state.budget?.[key] || 0) + '"></div>').join('');
  return pageHeading('Shared costs', 'A clear record of the things you split. Money moves between roommates, never through the app.', '<button class="button" data-action="open-modal" data-modal="add-expense">＋ Add an expense</button>') +
    '<section class="card page-card budget-estimator"><div class="card-header" style="padding:0 0 8px"><div><h2 class="card-title">First-home cash estimate</h2><p class="card-subtitle">Separate one-time move-in costs from what you will owe each month.</p></div><span class="soft-pill">ESTIMATE</span></div><form id="budgetForm" class="budget-form"><div class="budget-fields">' + budgetFields + '</div><div class="budget-total"><div><small>Estimated cash to get moved in</small><strong>' + money(estimatedMoveIn) + '</strong></div><button class="button" type="submit">Save estimate</button></div></form><p class="money-intro">Use your lease and actual quotes to fill this in. This estimate is a planning aid; it does not determine each roommate’s legal responsibility.</p></section>' +
    '<div class="balance-grid"><div class="stack"><section class="balance-hero"><span class="eyebrow">SHARED COSTS TRACKED</span><div class="balance-total">' + money(total) + '</div><p>Across ' + state.expenses.length + ' expenses · rough equal share ' + money(total / memberCount) + ' per account</p></section><section class="card page-card"><div class="card-header" style="padding:0 0 13px"><div><h2 class="card-title">Recent expenses</h2><p class="card-subtitle">Every roommate can see who covered what.</p></div></div>' + (rows || '<div class="empty-state">No shared expenses yet.</div>') + '</section></div>' +
    (authSession && activeHousehold ? '<section class="card page-card"><div class="card-header" style="padding:0 0 8px"><div><h2 class="card-title">Settle up directly</h2><p class="card-subtitle">Goodhouse tracks costs. It does not move or hold money.</p></div></div><p class="money-intro">Each equal share is an estimate using the number of household accounts. Confirm your actual split together.</p></section>' : '<section class="card page-card"><div class="card-header" style="padding:0 0 8px"><div><h2 class="card-title">Who’s up and who’s covered</h2><p class="card-subtitle">Net balance based on the sample expenses.</p></div></div>' + balanceRows + '<div class="agreement-note" style="margin-top:12px">Settle directly with Venmo, Zelle, or whatever your house uses. Goodhouse never holds money.</div></section>') + '</div>';
}

function renderRules() {
  const ruleRows = state.rules.map((rule, index) => '<div class="rule-row"><span class="rule-number">' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + escapeHTML(rule.text) + '</strong><small>' + escapeHTML(rule.group) + ' · ' + (rule.signed === 4 ? 'agreed by the house' : 'suggested · review together') + '</small></div><span class="vote-pill">' + (rule.signed === 4 ? '✓ 4/4' : '◷ review') + '</span></div>').join('');
  return pageHeading('Our agreement', 'House rules that came from the people who live here. Equal expectations, clearer conversations.', '<button class="button" data-action="open-modal" data-modal="add-rule">＋ Suggest a rule</button>') +
    '<section class="vault-banner"><div><strong style="font:700 13px Manrope">Written by the house, for the house.</strong><p>Start with a shared set of expectations, then review them together when something changes.</p></div><span class="soft-pill">' + state.rules.length + ' RULES</span></section>' +
    '<section class="card page-card"><div class="card-header" style="padding:0 0 13px"><div><h2 class="card-title">' + escapeHTML(activeHousehold?.name || 'Willow House') + ' · shared agreement</h2><p class="card-subtitle">Review house suggestions together.</p></div><button class="text-button" data-action="toast" data-message="The amendment vote flow is coming next.">Amend by vote ↗</button></div><div class="rules-list">' + (ruleRows || '<div class="empty-state">No house rules yet. Suggest one to start a conversation.</div>') + '</div></section>' +
    '<div class="agreement-note" style="margin-top:15px"><strong>How it works:</strong> Start with a shared set of expectations, talk through the parts that need compromise, and agree together. The app keeps the record; your house makes the rules.</div>';
}

function render() {
  const pageByView = {
    coach: renderCopilot,
    lease: renderLease,
    movein: renderMoveIn,
    home: renderHome,
    chores: renderChores,
    details: renderDetails,
    vault: renderVault,
    costs: renderCosts,
    rules: renderRules,
  };
  const labels = { coach: 'HOME CO-PILOT', lease: 'LEASE & RENTER GUIDE', movein: 'MOVE-IN ROADMAP', home: 'HOME OVERVIEW', chores: 'CHORE RHYTHM', details: 'HOUSE DETAILS', vault: 'DEPOSIT VAULT', costs: 'SHARED COSTS', rules: 'OUR AGREEMENT' };
  currentView = pageByView[currentView] ? currentView : 'coach';
  document.querySelector('#currentSection').textContent = labels[currentView];
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === currentView));
  const pending = state.chores.filter((chore) => !chore.done).length;
  document.querySelector('#pendingBadge').textContent = String(pending);
  document.querySelector('#pendingBadge').hidden = pending === 0;
  pageContent.innerHTML = pageByView[currentView]();
  updateConnectionLabel();
}

function openModal(type, choreId = '') {
  const chore = state.chores.find((item) => item.id === choreId);
  const roommateOptions = people.map((person) => '<option value="' + escapeHTML(person.name) + '"' + (chore && chore.person === person.name ? ' selected' : '') + '>' + escapeHTML(person.name) + '</option>').join('');
  let title = '';
  let description = '';
  let fields = '';
  if (type === 'account') {
    title = authSession ? 'Your household connection' : 'Connect your household';
    description = authSession ? 'Invite roommates to the same shared house, or close this panel.' : 'Sign in or create an account. The API keys stay on the server.';
    if (authSession && activeHousehold) {
      fields = '<div class="agreement-note">Connected to <strong>' + escapeHTML(activeHousehold.name) + '</strong>. Household actions are shared with its members.</div><button type="button" class="button light" data-action="generate-invite">Copy a 7-day roommate invite link</button><button type="button" class="text-button" data-action="sign-out">Sign out on this device</button>';
    } else {
      fields = (authSession ? '' : supabaseClient ? '<div class="field"><label for="authMode">Action</label><select id="authMode" name="mode"><option value="signin">Sign in</option><option value="signup">Create account</option></select></div><div class="field"><label for="authEmail">Email</label><input id="authEmail" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="authPassword">Password</label><input id="authPassword" name="password" type="password" required minlength="8" autocomplete="current-password"></div>' : '<div class="agreement-note">Configure Supabase and OpenAI server variables, then restart the app server. No passwords or keys belong in this page.</div>') +
        '<div class="field"><label for="inviteCode">Roommate invite link or code (optional)</label><input id="inviteCode" name="invite" value="' + escapeHTML(new URLSearchParams(location.search).get('invite') || '') + '" placeholder="Paste a link from a housemate"></div>' +
        (!authSession ? '<div class="field"><label for="houseName">New house name</label><input id="houseName" name="houseName" value="Willow House"></div>' : '') +
        '<div class="form-row"><div class="field"><label for="houseState">State</label><select id="houseState" name="state"><option value="">Choose a state</option>' + usStates.map((name) => '<option value="' + escapeHTML(name) + '"' + (state.location.state === name ? ' selected' : '') + '>' + escapeHTML(name) + '</option>').join('') + '</select></div><div class="field"><label for="houseCity">City</label><input id="houseCity" name="city" value="' + escapeHTML(state.location.city) + '" placeholder="City or county"></div></div>';
    }
  } else if (type === 'flag-chore') {
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
      '<div class="field"><label for="chorePerson">Who’s on it?</label>' + (authSession && activeHousehold ? '<input id="chorePerson" name="person" placeholder="Roommate name" required>' : '<select id="chorePerson" name="person">' + people.map((person) => '<option value="' + escapeHTML(person.name) + '">' + escapeHTML(person.name) + '</option>').join('') + '</select>') + '</div>';
  } else if (type === 'add-rule') {
    title = 'Suggest a house rule';
    description = 'Your house reviews it together before it becomes part of the agreement.';
    fields = '<div class="field"><label for="ruleText">What would make living together easier?</label><textarea id="ruleText" name="text" required placeholder="Say it in your own words."></textarea></div><div class="field"><label for="ruleGroup">Area</label><select id="ruleGroup" name="group"><option>Shared spaces</option><option>Kitchen</option><option>Bathroom</option><option>Guests</option><option>Quiet hours</option><option>Other</option></select></div>';
  } else if (type === 'add-expense') {
    title = 'Log a shared expense';
    description = 'Record who paid. The house can settle up directly.';
    fields = '<div class="field"><label for="expenseTitle">What was it for?</label><input id="expenseTitle" name="title" required placeholder="e.g. Water bill"></div><div class="form-row"><div class="field"><label for="expenseAmount">Total amount</label><input id="expenseAmount" name="amount" required type="number" min="0.01" step="0.01" placeholder="0.00"></div><div class="field"><label for="expensePayer">Paid by</label>' + (authSession && activeHousehold ? '<input id="expensePayer" name="paidBy" required placeholder="Roommate name">' : '<select id="expensePayer" name="paidBy">' + people.map((person) => '<option value="' + escapeHTML(person.name) + '">' + escapeHTML(person.name) + '</option>').join('') + '</select>') + '</div></div><label class="check-row"><input type="checkbox" name="recurring"> This is a recurring monthly bill</label>';
  } else if (type === 'add-photo') {
    title = 'Add a room photo';
    description = 'A timestamped photo and a short note can save a lot of move-out stress.';
    fields = '<div class="field"><label for="photoFile">Choose a photo</label><input id="photoFile" name="file" type="file" accept="image/*" required></div><div class="field"><label for="photoRoom">Room</label><select id="photoRoom" name="room"><option>Living room</option><option>Kitchen</option><option>Bathroom</option><option>Bedroom</option><option>Entryway</option><option>Other</option></select></div><div class="field"><label for="photoNote">Condition note (optional)</label><input id="photoNote" name="note" placeholder="e.g. Small scratch already on the door"></div>';
  } else if (type === 'edit-details') {
    title = 'Update house details';
    description = 'For now, this demo keeps the details editable on this device.';
    description = authSession && activeHousehold ? 'Only save details your household wants to share. A Wi-Fi password will be visible to all house members.' : description;
    fields = '<div class="field"><label for="wifiValue">Wi-Fi network</label><input id="wifiValue" name="wifiValue" value="' + escapeHTML(detailValue('Wi-Fi network', '')) + '"></div><div class="field"><label for="wifiPassword">Wi-Fi password</label><input id="wifiPassword" name="wifiPassword" value="' + escapeHTML(detailValue('Wi-Fi password', '')) + '"></div><div class="field"><label for="rentDue">Rent due</label><input id="rentDue" name="rentDue" value="' + escapeHTML(detailValue('Rent due', '')) + '"></div>';
  } else if (type === 'maintenance') {
    title = 'Log a repair';
    description = 'Keep the status visible so nobody has to ask twice.';
    fields = '<div class="field"><label for="repairText">What needs attention?</label><input id="repairText" name="text" required placeholder="e.g. The hallway light is out"></div><div class="field"><label for="repairNote">Helpful details</label><textarea id="repairNote" name="note" placeholder="Where it is, what you tried, or who you contacted."></textarea></div>';
  }
  modalRoot.innerHTML = '<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><h2 id="modalTitle">' + title + '</h2><p>' + description + '</p></div><button class="close-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><form class="form-grid" data-modal-form="' + type + '">' + fields + '<div class="modal-actions"><button class="button light" type="button" data-action="close-modal">Cancel</button>' + (authSession && activeHousehold ? '' : '<button class="button" type="submit">' + (type === 'flag-chore' ? 'Log gentle nudge' : type === 'add-photo' ? 'Save photo' : type === 'add-rule' ? 'Send for house review' : type === 'edit-details' ? 'Save details' : type === 'maintenance' ? 'Log repair' : 'Continue') + '</button>') + '</div></form></section></div>';
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

function proposalLabel(proposal) {
  const args = proposal.arguments || {};
  if (proposal.action === 'create_chore') return 'Add chore: ' + args.title;
  if (proposal.action === 'complete_chore') return (args.done ? 'Mark complete: ' : 'Reopen: ') + args.chore_title;
  if (proposal.action === 'create_expense') return 'Log ' + money(Number(args.amount || 0)) + ' for ' + args.title;
  if (proposal.action === 'propose_rule') return 'Suggest house rule: ' + args.text;
  if (proposal.action === 'toggle_checklist') return (args.done ? 'Mark complete: ' : 'Mark incomplete: ') + args.item_key;
  if (proposal.action === 'log_maintenance') return 'Log repair: ' + args.description;
  if (proposal.action === 'save_budget') return 'Save a move-in budget totaling ' + money(Object.values(args).reduce((sum, value) => sum + Number(value || 0), 0));
  return 'Save this household change';
}

function appendChatMessage(role, text, citations = [], proposal = null) {
  const thread = document.querySelector('#chatThread');
  if (!thread) return;
  const message = document.createElement('div');
  message.className = 'chat-message ' + (role === 'user' ? 'user-message' : 'assistant-message');
  const label = document.createElement('strong');
  label.textContent = role === 'user' ? 'You' : 'Goodhouse';
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  message.append(label, paragraph);
  if (citations.length) {
    const sourceList = document.createElement('div');
    sourceList.className = 'chat-citations';
    citations.forEach((citation) => {
      const item = document.createElement(citation.url ? 'a' : 'small');
      if (citation.url) {
        item.href = citation.url;
        item.target = '_blank';
        item.rel = 'noreferrer';
      }
      item.textContent = citation.title || citation.url || String(citation);
      sourceList.append(item);
    });
    message.append(sourceList);
  }
  if (proposal) {
    const card = document.createElement('div');
    card.className = 'agent-proposal';
    const summary = document.createElement('p');
    summary.textContent = proposalLabel(proposal);
    const confirm = document.createElement('button');
    confirm.className = 'button light small';
    confirm.type = 'button';
    confirm.textContent = 'Review and save';
    confirm.dataset.action = 'confirm-proposal';
    confirm.dataset.id = 'proposal-' + (++pendingProposalSequence);
    pendingProposals.set(confirm.dataset.id, proposal);
    card.append(summary, confirm);
    message.append(card);
  }
  thread.append(message);
  thread.scrollTop = thread.scrollHeight;
}

async function askAgent(message) {
  appendChatMessage('user', message);
  if (!authSession || !activeHousehold || !appConfig.apiConfigured) {
    appendChatMessage('assistant', 'I’m in preview mode, so I can’t read a real lease or household record yet. Connect the OpenAI and Supabase server settings, then sign in to activate the co-pilot.');
    return;
  }
  chatHistory.push({ role: 'user', content: message });
  appendChatMessage('assistant', 'Let me check your house information and lease notes…');
  try {
    const result = await apiRequest('/api/households/' + activeHousehold.id + '/assistant', {
      method: 'POST',
      body: JSON.stringify({ message, messages: chatHistory.slice(-12) }),
    });
    const thread = document.querySelector('#chatThread');
    thread?.lastElementChild?.remove();
    appendChatMessage('assistant', result.answer, result.citations || [], result.proposal || null);
    chatHistory.push({ role: 'assistant', content: result.proposal ? result.answer + ' Proposed change: ' + proposalLabel(result.proposal) : result.answer });
  } catch (error) {
    const thread = document.querySelector('#chatThread');
    thread?.lastElementChild?.remove();
    appendChatMessage('assistant', error.message);
  }
}

async function readFileBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const blockSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += blockSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + blockSize));
  }
  return btoa(binary);
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
    if (authSession && activeHousehold) {
      persistHouseholdAction('complete_chore', { chore_id: chore.id, done: chore.done }).then(() => { render(); showToast(chore.done ? 'Nice. One less thing to think about.' : 'Added back to the list.'); }).catch((error) => { showToast(error.message); loadHouseholdSnapshot().then(render); });
    } else {
      pushActivity(chore.person.split(' ')[0] + (chore.done ? ' finished ' : ' reopened ') + chore.title.toLowerCase(), chore.done ? '✓' : '◷');
      saveState(); render(); showToast(chore.done ? 'Nice. One less thing to think about.' : 'Added back to the list.');
    }
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
  } else if (action === 'ask-prompt') {
    askAgent(actionButton.dataset.prompt);
  } else if (action === 'generate-invite') {
    apiRequest('/api/households/' + activeHousehold.id + '/invites', { method: 'POST', body: '{}' }).then(async (result) => {
      try { await navigator.clipboard.writeText(result.inviteUrl); showToast('7-day invite link copied.'); }
      catch { showToast(result.inviteUrl); }
    }).catch((error) => showToast(error.message));
  } else if (action === 'sign-out') {
    supabaseClient?.auth.signOut().then(({ error }) => { if (error) showToast(error.message); else { modalRoot.innerHTML = ''; showToast('Signed out on this device.'); } });
  } else if (action === 'confirm-proposal') {
    const proposal = pendingProposals.get(id);
    if (!proposal || !activeHousehold) return;
    actionButton.disabled = true;
    actionButton.textContent = 'Saving…';
    apiRequest('/api/households/' + activeHousehold.id + '/actions', {
      method: 'POST',
      body: JSON.stringify({ action: proposal.action, arguments: proposal.arguments }),
    }).then(async () => {
      pendingProposals.delete(id);
      const chatMarkup = document.querySelector('#chatThread')?.innerHTML || '';
      await loadHouseholdSnapshot();
      render();
      const updatedThread = document.querySelector('#chatThread');
      if (updatedThread && chatMarkup) {
        updatedThread.innerHTML = chatMarkup;
        const updatedButton = [...updatedThread.querySelectorAll('[data-action="confirm-proposal"]')].find((button) => button.dataset.id === id);
        if (updatedButton) { updatedButton.textContent = 'Saved to house'; updatedButton.disabled = true; }
      }
      showToast('Household update saved.');
    }).catch((error) => {
      actionButton.disabled = false;
      actionButton.textContent = 'Review and save';
      showToast(error.message);
    });
  } else if (action === 'toggle-checklist') {
    state.checklist[id] = !state.checklist[id];
    if (authSession && activeHousehold) {
      persistHouseholdAction('toggle_checklist', { item_key: id, done: state.checklist[id] }).then(render).catch((error) => showToast(error.message));
    } else { saveState(); render(); }
  } else if (action === 'save-location') {
    state.location.state = document.querySelector('#legalState')?.value || '';
    state.location.city = document.querySelector('#legalCity')?.value.trim() || '';
    saveState();
    if (authSession && activeHousehold) {
      apiRequest('/api/households/' + activeHousehold.id + '/location', {
        method: 'PATCH',
        body: JSON.stringify({ state: state.location.state, city: state.location.city }),
      }).catch((error) => showToast(error.message));
    }
    render();
    showToast(state.location.state && state.location.city ? 'Location saved. Legal guidance can search state and city resources.' : 'Add both your state and city or county for local renter guidance.');
  }
}

async function handleSubmit(event) {
  if (event.target.id === 'budgetForm') {
    event.preventDefault();
    const data = new FormData(event.target);
    const budget = Object.fromEntries(['security_deposit','first_month_rent','application_fees','utility_setup','moving','emergency_buffer'].map((key) => [key, Number(data.get(key) || 0)]));
    if (Object.values(budget).some((amount) => !Number.isFinite(amount) || amount < 0 || amount > 100000)) return showToast('Enter valid amounts between $0 and $100,000.');
    try {
      if (authSession && activeHousehold) await persistHouseholdAction('save_budget', budget);
      else { state.budget = budget; saveState(); }
      render();
      showToast('Move-in estimate saved.');
    } catch (error) { showToast(error.message); }
    return;
  }
  if (event.target.id === 'chatForm') {
    event.preventDefault();
    const input = event.target.elements.message;
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    await askAgent(message);
    return;
  }
  if (event.target.id === 'leaseForm') {
    event.preventDefault();
    const form = event.target;
    const file = form.elements.file.files[0];
    const status = document.querySelector('#leaseStatus');
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 50 * 1024 * 1024) {
      status.textContent = 'Choose a PDF under 50 MB.';
      return;
    }
    if (!authSession || !activeHousehold || !appConfig.apiConfigured) {
      status.textContent = 'Connect OpenAI and Supabase, sign in, and create or join a house before scanning a lease.';
      return;
    }
    status.textContent = 'Sending the PDF for a cited summary…';
    try {
      const fileBase64 = await readFileBase64(file);
      const result = await apiRequest('/api/households/' + activeHousehold.id + '/lease/analyze', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, fileBase64, jurisdiction: state.location }),
      });
      leaseSummary = result.lease;
      status.textContent = 'Lease summary saved. The original PDF was not retained by this prototype.';
      render();
    } catch (error) {
      status.textContent = error.message;
    }
    return;
  }
  const form = event.target.closest('[data-modal-form]');
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const type = form.dataset.modalForm;
  if (type === 'account') {
    if (authSession && activeHousehold) { modalRoot.innerHTML = ''; return; }
    if (!supabaseClient) return showToast('Set the Supabase server variables first; see README.');
    if (!authSession) {
      const email = String(data.get('email') || '').trim();
      const password = String(data.get('password') || '');
      const authResult = data.get('mode') === 'signup'
        ? await supabaseClient.auth.signUp({ email, password })
        : await supabaseClient.auth.signInWithPassword({ email, password });
      if (authResult.error) return showToast(authResult.error.message);
      authSession = authResult.data.session;
      if (!authSession) {
        modalRoot.innerHTML = '';
        return showToast('Check your email to confirm the account, then sign in.');
      }
    }
    await loadHouseholds();
    if (!activeHousehold) {
      const token = inviteToken(data.get('invite') || new URLSearchParams(location.search).get('invite'));
      if (token) {
        const joined = await apiRequest('/api/invites/accept', { method: 'POST', body: JSON.stringify({ token }) });
        activeHousehold = joined.household;
      } else {
        const created = await apiRequest('/api/households', {
          method: 'POST',
          body: JSON.stringify({ name: String(data.get('houseName') || 'My house'), state: String(data.get('state') || ''), city: String(data.get('city') || '') }),
        });
        activeHousehold = created.household;
      }
      state.location = { state: activeHousehold.state || '', city: activeHousehold.city || '' };
    }
    if (activeHousehold) await loadHouseholdSnapshot();
    history.replaceState({}, '', location.pathname);
    modalRoot.innerHTML = '';
    updateConnectionLabel();
    render();
    showToast('House connected. Your co-pilot is ready.');
  } else if (type === 'flag-chore') {
    const chore = state.chores.find((item) => item.id === data.get('choreId'));
    if (!chore) return;
    if (authSession && activeHousehold) {
      await persistHouseholdAction('flag_chore', { chore_id: chore.id, responsible: String(data.get('responsible')), note: String(data.get('note') || '').trim(), anonymous: data.get('anonymous') === 'on' });
      pushActivity('A gentle nudge was logged about ' + chore.title.toLowerCase(), '!');
      showToast('Flag saved to the shared house record.');
    } else {
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
    }
  } else if (type === 'add-chore') {
    const title = String(data.get('title')).trim();
    const area = String(data.get('area') || 'House').trim();
    const day = Number(data.get('day'));
    const person = String(data.get('person'));
    if (authSession && activeHousehold) await persistHouseholdAction('create_chore', { title, area, day, assigned_to_name: person });
    else state.chores.push({ id: 'c' + Date.now(), title, area, day, person, done: false });
    pushActivity('A new chore was added to the house rhythm', '◷');
    showToast('Added to the house rhythm.');
  } else if (type === 'add-rule') {
    const text = String(data.get('text')).trim();
    if (authSession && activeHousehold) await persistHouseholdAction('propose_rule', { text, category: String(data.get('group')) });
    else state.rules.push({ text, group: String(data.get('group')), signed: 0 });
    pushActivity('A new house rule was suggested for review', '✳');
    showToast('Suggestion added for the house to review.');
  } else if (type === 'add-expense') {
    const amount = Number(data.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) return showToast('Enter an amount greater than zero.');
    const title = String(data.get('title')).trim();
    const paidBy = String(data.get('paidBy'));
    const recurring = data.get('recurring') === 'on';
    if (authSession && activeHousehold) await persistHouseholdAction('create_expense', { title, amount, paid_by_label: paidBy, recurring });
    else state.expenses.push({ id: 'e' + Date.now(), title, amount, paidBy, date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date()), kind: recurring ? 'utility' : 'household' });
    pushActivity('A shared expense was logged: ' + String(data.get('title')).trim(), '$');
    showToast('Expense added. Balances updated.');
  } else if (type === 'add-photo') {
    const file = data.get('file');
    if (!file || !file.size) return showToast('Choose an image first.');
    try {
      const image = await compressImage(file);
      if (authSession && activeHousehold) {
        const result = await apiRequest('/api/households/' + activeHousehold.id + '/photos', { method: 'POST', body: JSON.stringify({ contentType: 'image/jpeg', fileBase64: image.split(',')[1], room: String(data.get('room')), note: String(data.get('note') || '').trim() }) });
        state.photos.unshift({ id: result.photo.id, room: result.photo.room, note: result.photo.note, date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(result.photo.created_at)), image: result.photo.image_url });
      } else state.photos.unshift({ id: 'p' + Date.now(), room: String(data.get('room')), note: String(data.get('note') || '').trim(), date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()), image });
      pushActivity('A move-in photo was added to the deposit vault', '▧');
      showToast(authSession && activeHousehold ? 'Saved to the shared deposit vault.' : 'Saved to this browser’s deposit vault.');
    } catch {
      return showToast('That photo could not be saved. Try another image.');
    }
  } else if (type === 'edit-details') {
    const wifiName = String(data.get('wifiValue')).trim();
    const wifiPassword = String(data.get('wifiPassword')).trim();
    const rentDue = String(data.get('rentDue')).trim();
    if (authSession && activeHousehold) {
      await persistHouseholdAction('add_detail', { label: 'Wi-Fi network', value: wifiName, sensitivity: 'shared' });
      await persistHouseholdAction('add_detail', { label: 'Wi-Fi password', value: wifiPassword, sensitivity: 'shared' });
      await persistHouseholdAction('add_detail', { label: 'Rent due', value: rentDue, sensitivity: 'shared' });
    } else {
      state.details[0].value = wifiName;
      state.details[0].note = 'Password: ' + wifiPassword;
      state.details[3].value = rentDue;
    }
    pushActivity('House details were updated', '⌂');
    showToast('House details updated.');
  } else if (type === 'maintenance') {
    const repairText = String(data.get('text')).trim();
    if (authSession && activeHousehold) await persistHouseholdAction('log_maintenance', { description: repairText, note: String(data.get('note') || '').trim() });
    else state.repairs.unshift({ text: repairText, note: String(data.get('note') || '').trim() || 'Logged today', status: 'Open' });
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
initializeBackend();
