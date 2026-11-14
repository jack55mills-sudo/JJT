import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const supabaseAdmin = hasSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
const openai = hasOpenAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const aiUsage = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '70mb' }));

const publicFiles = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/styles.css', 'styles.css'],
  ['/app.js', 'app.js'],
  ['/manifest.webmanifest', 'manifest.webmanifest'],
  ['/service-worker.js', 'service-worker.js'],
  ['/icon.svg', 'icon.svg'],
]);
app.get([...publicFiles.keys()], (req, res) => {
  const file = publicFiles.get(req.path);
  if (req.path === '/service-worker.js') res.set('Service-Worker-Allowed', '/');
  res.sendFile(path.join(root, file));
});

app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    authConfigured: hasSupabase,
    apiConfigured: hasSupabase && hasOpenAI,
  });
});

function bearer(req) {
  const value = req.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function userFor(req) {
  if (!hasSupabase) throw Object.assign(new Error('Supabase is not configured on the server.'), { status: 503 });
  const token = bearer(req);
  if (!token) throw Object.assign(new Error('Sign in to continue.'), { status: 401 });
  const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw Object.assign(new Error('Your session expired. Sign in again.'), { status: 401 });
  return data.user;
}

function consumeAiQuota(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const current = aiUsage.get(userId);
  const usage = !current || now - current.startedAt >= windowMs ? { startedAt: now, count: 0 } : current;
  if (usage.count >= 30) throw Object.assign(new Error('This account reached its 30 AI requests per hour limit. Try again later.'), { status: 429 });
  usage.count += 1;
  aiUsage.set(userId, usage);
}

async function householdFor(req, householdId) {
  const user = await userFor(req);
  const { data: membership, error } = await supabaseAdmin
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw Object.assign(new Error('Could not check household access.'), { status: 500 });
  if (!membership) throw Object.assign(new Error('You do not have access to this household.'), { status: 403 });
  return { user, role: membership.role };
}

function asyncRoute(handler) {
  return (req, res) => Promise.resolve(handler(req, res)).catch((error) => {
    res.status(error.status || 500).json({ error: error.message || 'Something went wrong.' });
  });
}

app.get('/api/households', asyncRoute(async (req, res) => {
  const user = await userFor(req);
  const { data: memberships, error: memberError } = await supabaseAdmin
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id);
  if (memberError) throw memberError;
  const ids = memberships.map((item) => item.household_id);
  if (!ids.length) return res.json([]);
  const { data, error } = await supabaseAdmin.from('households').select('id,name,state,city').in('id', ids).order('created_at');
  if (error) throw error;
  res.json(data || []);
}));

app.get('/api/households/:id/snapshot', asyncRoute(async (req, res) => {
  const { role } = await householdFor(req, req.params.id);
  const [lease, chores, expenses, rules, detailQuery, repairs, checklist, photoQuery, members, flags, budget] = await Promise.all([
    supabaseAdmin.from('lease_summaries').select('id,filename,summary,created_at').eq('household_id', req.params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from('chores').select('*').eq('household_id', req.params.id).order('day'),
    supabaseAdmin.from('shared_expenses').select('*').eq('household_id', req.params.id).order('created_at', { ascending: false }),
    supabaseAdmin.from('house_rules').select('*').eq('household_id', req.params.id).order('created_at'),
    supabaseAdmin.from('house_details').select('*').eq('household_id', req.params.id).order('created_at'),
    supabaseAdmin.from('maintenance_records').select('*').eq('household_id', req.params.id).order('created_at', { ascending: false }),
    supabaseAdmin.from('movein_checklist').select('*').eq('household_id', req.params.id),
    supabaseAdmin.from('deposit_photos').select('*').eq('household_id', req.params.id).order('created_at', { ascending: false }),
    supabaseAdmin.from('household_members').select('user_id', { count: 'exact', head: true }).eq('household_id', req.params.id),
    supabaseAdmin.from('chore_flags').select('*,chores(title,day)').eq('household_id', req.params.id).order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('household_budgets').select('amounts').eq('household_id', req.params.id).maybeSingle(),
  ]);
  for (const result of [lease, chores, expenses, rules, detailQuery, repairs, checklist, photoQuery, members, flags, budget]) if (result.error) throw result.error;
  const details = (detailQuery.data || []).filter((item) => role === 'owner' || item.sensitivity !== 'owner_only');
  const photos = await Promise.all((photoQuery.data || []).map(async (photo) => {
    const { data, error } = await supabaseAdmin.storage.from('deposit-vault').createSignedUrl(photo.storage_path, 3600);
    if (error) return { ...photo, image_url: '' };
    return { ...photo, image_url: data.signedUrl };
  }));
  res.json({
    lease: lease.data ? { ...lease.data.summary, id: lease.data.id, filename: lease.data.filename } : null,
    chores: chores.data || [], expenses: expenses.data || [], rules: rules.data || [],
    details, repairs: repairs.data || [], checklist: checklist.data || [], photos, flags: flags.data || [], memberCount: members.count || 1, budget: budget.data?.amounts || {},
  });
}));

app.post('/api/households/:id/invites', asyncRoute(async (req, res) => {
  const { user, role } = await householdFor(req, req.params.id);
  if (role !== 'owner') throw Object.assign(new Error('Only a household owner can invite roommates.'), { status: 403 });
  const token = crypto.randomBytes(20).toString('base64url');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseAdmin.from('household_invites').insert({ household_id: req.params.id, token, created_by: user.id, expires_at: expiresAt });
  if (error) throw error;
  const publicUrl = process.env.APP_URL || (req.protocol + '://' + req.get('host'));
  res.status(201).json({ inviteUrl: new URL('/?invite=' + encodeURIComponent(token), publicUrl).toString(), expiresAt });
}));

app.post('/api/invites/accept', asyncRoute(async (req, res) => {
  const user = await userFor(req);
  const token = String(req.body.token || '').trim();
  if (!token) throw Object.assign(new Error('Paste a household invite link or code.'), { status: 400 });
  const { data: invite, error } = await supabaseAdmin.from('household_invites').select('household_id,expires_at').eq('token', token).maybeSingle();
  if (error) throw error;
  if (!invite || new Date(invite.expires_at) < new Date()) throw Object.assign(new Error('That invite is invalid or has expired.'), { status: 400 });
  const { error: joinError } = await supabaseAdmin.from('household_members').upsert({ household_id: invite.household_id, user_id: user.id, role: 'member' }, { onConflict: 'household_id,user_id' });
  if (joinError) throw joinError;
  const { data: household, error: houseError } = await supabaseAdmin.from('households').select('id,name,state,city').eq('id', invite.household_id).single();
  if (houseError) throw houseError;
  res.json({ household });
}));

async function applyHouseholdAction(req, action, args) {
  const { user, role } = await householdFor(req, req.params.id);
  const householdId = req.params.id;
  let query;
  if (action === 'create_chore') {
    const title = String(args.title || '').trim().slice(0, 120);
    if (!title) throw Object.assign(new Error('Give the chore a name.'), { status: 400 });
    const day = Number(args.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) throw Object.assign(new Error('Choose a day from Monday to Sunday.'), { status: 400 });
    query = supabaseAdmin.from('chores').insert({ household_id: householdId, title, area: String(args.area || '').slice(0, 80), day, assigned_to_name: String(args.assigned_to_name || '').slice(0, 80) }).select().single();
  } else if (action === 'complete_chore') {
    query = supabaseAdmin.from('chores').update({ status: args.done ? 'done' : 'open' }).eq('household_id', householdId).eq('id', args.chore_id).select().single();
  } else if (action === 'flag_chore') {
    const { data: chore, error: choreError } = await supabaseAdmin.from('chores').select('id').eq('household_id', householdId).eq('id', args.chore_id).maybeSingle();
    if (choreError) throw choreError;
    if (!chore) throw Object.assign(new Error('That chore is no longer in this house plan.'), { status: 404 });
    query = supabaseAdmin.from('chore_flags').insert({ household_id: householdId, chore_id: args.chore_id, responsible_label: String(args.responsible || '').slice(0, 80), note: String(args.note || '').slice(0, 500), is_anonymous: Boolean(args.anonymous), reported_by: user.id }).select().single();
  } else if (action === 'create_expense') {
    const amount = Number(args.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error('Enter an amount greater than zero.'), { status: 400 });
    query = supabaseAdmin.from('shared_expenses').insert({ household_id: householdId, title: String(args.title || '').trim().slice(0, 120), amount, paid_by_label: String(args.paid_by_label || '').slice(0, 80), recurring: Boolean(args.recurring) }).select().single();
  } else if (action === 'propose_rule') {
    const text = String(args.text || '').trim().slice(0, 500);
    if (!text) throw Object.assign(new Error('Write a short rule suggestion.'), { status: 400 });
    query = supabaseAdmin.from('house_rules').insert({ household_id: householdId, text, category: String(args.category || 'House').slice(0, 80), status: 'proposed', created_by: user.id }).select().single();
  } else if (action === 'toggle_checklist') {
    query = supabaseAdmin.from('movein_checklist').upsert({ household_id: householdId, item_key: String(args.item_key || '').slice(0, 50), done: Boolean(args.done), updated_at: new Date().toISOString() }, { onConflict: 'household_id,item_key' }).select().single();
  } else if (action === 'add_detail') {
    const sensitivity = args.sensitivity === 'owner_only' ? 'owner_only' : 'shared';
    const label = String(args.label || '').trim().slice(0, 80);
    if (!label) throw Object.assign(new Error('Give this house detail a label.'), { status: 400 });
    if (sensitivity === 'owner_only' && role !== 'owner') throw Object.assign(new Error('Only an owner can save private house details.'), { status: 403 });
    const { data: existing, error: detailError } = await supabaseAdmin.from('house_details').select('sensitivity').eq('household_id', householdId).eq('label', label).maybeSingle();
    if (detailError) throw detailError;
    if (existing?.sensitivity === 'owner_only' && role !== 'owner') throw Object.assign(new Error('Only an owner can change this private house detail.'), { status: 403 });
    query = supabaseAdmin.from('house_details').upsert({ household_id: householdId, label, value: String(args.value || '').trim().slice(0, 500), sensitivity }, { onConflict: 'household_id,label' }).select().single();
  } else if (action === 'log_maintenance') {
    const description = String(args.description || '').trim().slice(0, 500);
    if (!description) throw Object.assign(new Error('Describe what needs repair.'), { status: 400 });
    query = supabaseAdmin.from('maintenance_records').insert({ household_id: householdId, description, note: String(args.note || '').trim().slice(0, 1000), status: 'open', created_by: user.id }).select().single();
  } else if (action === 'save_budget') {
    const keys = ['security_deposit','first_month_rent','application_fees','utility_setup','moving','emergency_buffer'];
    const amounts = Object.fromEntries(keys.map((key) => [key, Number(args[key] || 0)]));
    if (Object.values(amounts).some((value) => !Number.isFinite(value) || value < 0 || value > 100000)) throw Object.assign(new Error('Enter valid amounts between $0 and $100,000.'), { status: 400 });
    query = supabaseAdmin.from('household_budgets').upsert({ household_id: householdId, amounts, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'household_id' }).select().single();
  } else {
    throw Object.assign(new Error('That household action is not available.'), { status: 400 });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

app.post('/api/households/:id/actions', asyncRoute(async (req, res) => {
  const action = String(req.body.action || '');
  const result = await applyHouseholdAction(req, action, req.body.arguments || {});
  res.status(201).json({ action, result });
}));

app.post('/api/households/:id/photos', asyncRoute(async (req, res) => {
  const { user } = await householdFor(req, req.params.id);
  const contentType = String(req.body.contentType || '');
  const fileBase64 = String(req.body.fileBase64 || '');
  if (contentType !== 'image/jpeg' || !fileBase64) throw Object.assign(new Error('Choose a room photo to upload.'), { status: 400 });
  const buffer = Buffer.from(fileBase64, 'base64');
  if (buffer.length > 5 * 1024 * 1024) throw Object.assign(new Error('Compressed photos must be under 5 MB.'), { status: 413 });
  const id = crypto.randomUUID();
  const storagePath = req.params.id + '/' + id + '.jpg';
  const { error: uploadError } = await supabaseAdmin.storage.from('deposit-vault').upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;
  const { data: photo, error } = await supabaseAdmin.from('deposit_photos').insert({ household_id: req.params.id, storage_path: storagePath, room: String(req.body.room || 'Room').slice(0, 80), note: String(req.body.note || '').slice(0, 500), uploaded_by: user.id }).select().single();
  if (error) {
    await supabaseAdmin.storage.from('deposit-vault').remove([storagePath]);
    throw error;
  }
  const { data: signed } = await supabaseAdmin.storage.from('deposit-vault').createSignedUrl(storagePath, 3600);
  res.status(201).json({ photo: { ...photo, image_url: signed?.signedUrl || '' } });
}));

app.post('/api/households', asyncRoute(async (req, res) => {
  const user = await userFor(req);
  const name = String(req.body.name || '').trim().slice(0, 80);
  if (!name) throw Object.assign(new Error('Give your household a name.'), { status: 400 });
  const { data: household, error } = await supabaseAdmin.from('households')
    .insert({ name, state: String(req.body.state || '').trim(), city: String(req.body.city || '').trim(), created_by: user.id })
    .select('id,name,state,city')
    .single();
  if (error) throw error;
  const { error: memberError } = await supabaseAdmin.from('household_members').insert({ household_id: household.id, user_id: user.id, role: 'owner' });
  if (memberError) {
    await supabaseAdmin.from('households').delete().eq('id', household.id);
    throw memberError;
  }
  res.status(201).json({ household });
}));

app.patch('/api/households/:id/location', asyncRoute(async (req, res) => {
  await householdFor(req, req.params.id);
  const state = String(req.body.state || '').trim().slice(0, 40);
  const city = String(req.body.city || '').trim().slice(0, 80);
  const { data, error } = await supabaseAdmin.from('households').update({ state, city }).eq('id', req.params.id).select('id,state,city').single();
  if (error) throw error;
  res.json(data);
}));

app.get('/api/households/:id/leases/latest', asyncRoute(async (req, res) => {
  await householdFor(req, req.params.id);
  const { data, error } = await supabaseAdmin.from('lease_summaries').select('id,filename,summary,created_at')
    .eq('household_id', req.params.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  res.json({ lease: data ? { ...data.summary, filename: data.filename, id: data.id } : null });
}));

const leaseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    terms: {
      type: 'object', additionalProperties: false,
      properties: {
        rent: { type: ['string', 'null'] },
        security_deposit: { type: ['string', 'null'] },
        start_date: { type: ['string', 'null'] },
        end_date: { type: ['string', 'null'] },
        rent_due: { type: ['string', 'null'] },
        late_fees: { type: ['string', 'null'] },
        notice_period: { type: ['string', 'null'] },
        utilities: { type: ['string', 'null'] },
        move_out: { type: ['string', 'null'] },
      },
      required: ['rent', 'security_deposit', 'start_date', 'end_date', 'rent_due', 'late_fees', 'notice_period', 'utilities', 'move_out'],
    },
    clauses: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          heading: { type: 'string' },
          page: { type: ['integer', 'null'] },
          quote: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['heading', 'page', 'quote', 'explanation'],
      },
    },
    questions_to_confirm: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'terms', 'clauses', 'questions_to_confirm'],
};

app.post('/api/households/:id/lease/analyze', asyncRoute(async (req, res) => {
  const { user } = await householdFor(req, req.params.id);
  if (!openai) throw Object.assign(new Error('OpenAI is not configured on the server.'), { status: 503 });
  consumeAiQuota(user.id);
  const filename = String(req.body.filename || '').slice(0, 160);
  const fileBase64 = String(req.body.fileBase64 || '');
  if (!filename.toLowerCase().endsWith('.pdf') || !fileBase64) throw Object.assign(new Error('Upload a PDF lease.'), { status: 400 });
  if (fileBase64.length > 68 * 1024 * 1024) throw Object.assign(new Error('The lease PDF must be under 50 MB.'), { status: 413 });

  const { data: household, error: householdError } = await supabaseAdmin.from('households').select('state,city').eq('id', req.params.id).single();
  if (householdError) throw householdError;
  const jurisdiction = [household.city, household.state].filter(Boolean).join(', ') || 'not provided';
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-6.1-sol',
    instructions: 'You are a careful renter education assistant. Extract only facts visible in the lease. Do not decide whether a clause is legal or enforceable. Use null when a term is absent or unclear. Cite the page number and quote exact source text for each key explanation. Explain jargon in plain language. Flag uncertainty as a question to confirm. This summary is not legal advice.',
    input: [{
      role: 'user',
      content: [
        { type: 'input_file', filename, file_data: 'data:application/pdf;base64,' + fileBase64, detail: 'high' },
        { type: 'input_text', text: 'Summarize this rental lease for a first-time renter. Household location: ' + jurisdiction + '. Extract rent, deposit, dates, due date, late fees, notice, utilities, move-out terms, and key obligations. Include page-cited clauses. Do not infer legal conclusions from the location.' },
      ],
    }],
    text: { format: { type: 'json_schema', name: 'lease_summary', strict: true, schema: leaseSchema } },
  });
  let summary;
  try { summary = JSON.parse(response.output_text); }
  catch { throw Object.assign(new Error('The lease scan returned an unreadable result. Try again or use a clearer PDF.'), { status: 502 }); }
  const { data: saved, error: saveError } = await supabaseAdmin.from('lease_summaries')
    .insert({ household_id: req.params.id, uploaded_by: user.id, filename, summary })
    .select('id,created_at')
    .single();
  if (saveError) throw saveError;
  res.json({ lease: { ...summary, id: saved.id, filename, created_at: saved.created_at } });
}));

const assistantActions = [
  { type: 'function', name: 'create_chore', description: 'Add a chore to the shared weekly house plan.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, area: { type: 'string' }, day: { type: 'integer' }, assigned_to_name: { type: 'string' } }, required: ['title','area','day','assigned_to_name'] } },
  { type: 'function', name: 'complete_chore', description: 'Mark an existing household chore complete or reopen it.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { chore_id: { type: 'string' }, chore_title: { type: 'string' }, done: { type: 'boolean' } }, required: ['chore_id','chore_title','done'] } },
  { type: 'function', name: 'create_expense', description: 'Record a household expense for later direct settlement between roommates.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, amount: { type: 'number' }, paid_by_label: { type: 'string' }, recurring: { type: 'boolean' } }, required: ['title','amount','paid_by_label','recurring'] } },
  { type: 'function', name: 'propose_rule', description: 'Suggest a house rule for roommates to review together.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { text: { type: 'string' }, category: { type: 'string' } }, required: ['text','category'] } },
  { type: 'function', name: 'toggle_checklist', description: 'Mark one move-in roadmap step complete or incomplete.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { item_key: { type: 'string', enum: ['lease','budget','utilities','insurance','walkthrough','emergency'] }, done: { type: 'boolean' } }, required: ['item_key','done'] } },
  { type: 'function', name: 'log_maintenance', description: 'Add a repair or maintenance item to the shared house record.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { description: { type: 'string' }, note: { type: 'string' } }, required: ['description','note'] } },
  { type: 'function', name: 'save_budget', description: 'Save a household move-in cost estimate after the user gives exact amounts.', strict: true, parameters: { type: 'object', additionalProperties: false, properties: { security_deposit: { type: 'number' }, first_month_rent: { type: 'number' }, application_fees: { type: 'number' }, utility_setup: { type: 'number' }, moving: { type: 'number' }, emergency_buffer: { type: 'number' } }, required: ['security_deposit','first_month_rent','application_fees','utility_setup','moving','emergency_buffer'] } },
];

app.post('/api/households/:id/assistant', asyncRoute(async (req, res) => {
  const { user, role } = await householdFor(req, req.params.id);
  if (!openai) throw Object.assign(new Error('OpenAI is not configured on the server.'), { status: 503 });
  consumeAiQuota(user.id);
  const message = String(req.body.message || '').trim().slice(0, 4000);
  if (!message) throw Object.assign(new Error('Ask a question first.'), { status: 400 });
  const messages = Array.isArray(req.body.messages)
    ? req.body.messages.slice(-12).map((item) => ({ role: item?.role === 'assistant' ? 'assistant' : 'user', content: String(item?.content || '').slice(0, 4000) })).filter((item) => item.content)
    : [{ role: 'user', content: message }];
  const { data: household, error: houseError } = await supabaseAdmin.from('households')
    .select('name,state,city').eq('id', req.params.id).single();
  if (houseError) throw houseError;
  const [leaseResult, choreResult, expenseResult, ruleResult, detailResult, repairResult, checklistResult, budgetResult] = await Promise.all([
    supabaseAdmin.from('lease_summaries').select('summary,filename,created_at').eq('household_id', req.params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from('chores').select('id,title,area,day,assigned_to_name,status,due_at').eq('household_id', req.params.id).limit(100),
    supabaseAdmin.from('shared_expenses').select('title,amount,paid_by_label,due_at,recurring').eq('household_id', req.params.id).limit(100),
    supabaseAdmin.from('house_rules').select('text,status,category').eq('household_id', req.params.id).limit(100),
    supabaseAdmin.from('house_details').select('label,value,sensitivity').eq('household_id', req.params.id).limit(100),
    supabaseAdmin.from('maintenance_records').select('description,note,status').eq('household_id', req.params.id).limit(100),
    supabaseAdmin.from('movein_checklist').select('item_key,done').eq('household_id', req.params.id),
    supabaseAdmin.from('household_budgets').select('amounts,updated_at').eq('household_id', req.params.id).maybeSingle(),
  ]);
  for (const result of [leaseResult, choreResult, expenseResult, ruleResult, detailResult, repairResult, checklistResult, budgetResult]) if (result.error) throw result.error;
  const context = {
    household,
    lease: leaseResult.data?.summary || null,
    chores: choreResult.data || [],
    expenses: expenseResult.data || [],
    rules: ruleResult.data || [],
    details: (detailResult.data || []).filter((item) => role === 'owner' || item.sensitivity !== 'owner_only'),
    maintenance: repairResult.data || [],
    move_in_checklist: checklistResult.data || [],
    move_in_budget: budgetResult.data?.amounts || null,
  };
  const wantsLaw = /legal|law|illegal|evict|eviction|deposit return|security deposit|withhold rent|notice to vacate|tenant right/i.test(message);
  const system = [
    'You are Goodhouse, the practical first-home co-pilot for college-age renters.',
    'Use household context below. Be warm, concise, and nonjudgmental. Explain unfamiliar renter terms.',
    'For lease claims, say “Your lease says” and cite the exact clause/page from the saved lease summary. If not present, say you could not find it.',
    'Do not decide whether a clause is enforceable, direct a user to withhold rent, or act as a lawyer or financial adviser.',
    'For legal questions, separate contract text from law. Only make jurisdiction-specific claims when you have a current official source; otherwise link to https://www.usa.gov/tenant-rights and recommend local legal aid for disputes.',
    'Never shame a roommate. You may propose one supported household action when the user clearly asks for it. The app will show it for confirmation; do not claim it was saved.',
    'Never invent lease text, people, costs, dates, or legal rules. If a fact is missing, say so and ask a focused follow-up.',
    'When proposing a chore, day numbers are 0=Monday through 6=Sunday. Do not choose a day, payer, amount, or budget value the user did not provide.',
    'Goodhouse records expenses but never holds money or calculates legal responsibility for rent or a lease.',
    'Current verified household context: ' + JSON.stringify(context),
  ].join('\n\n');
  const legalTools = wantsLaw && household.state && household.city ? [{ type: 'web_search' }] : [];
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-6.1-sol',
    instructions: system,
    input: messages,
    tools: [...legalTools, ...assistantActions],
    tool_choice: 'auto',
    max_output_tokens: 900,
  });
  const functionCall = (response.output || []).find((item) => item.type === 'function_call' && assistantActions.some((tool) => tool.name === item.name));
  if (functionCall) {
    let args;
    try { args = JSON.parse(functionCall.arguments); }
    catch { throw Object.assign(new Error('The proposed house action was incomplete. Ask again with the details.'), { status: 502 }); }
    if (functionCall.name === 'complete_chore') args.chore_title = choreResult.data.find((chore) => chore.id === args.chore_id)?.title || args.chore_title;
    res.json({ answer: 'I can prepare this change. Review it before it is saved.', proposal: { action: functionCall.name, arguments: args } });
    return;
  }
  const citations = [];
  for (const item of response.output || []) {
    for (const part of item.content || []) {
      for (const annotation of part.annotations || []) {
        if (annotation.type === 'url_citation') citations.push({ title: annotation.title, url: annotation.url });
      }
    }
  }
  res.json({ answer: response.output_text || 'I could not form a reliable answer from the household records.', citations });
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.listen(port, () => console.log('Goodhouse listening on http://localhost:' + port));
