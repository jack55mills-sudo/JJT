# Goodhouse

Goodhouse is a PWA for first-time renters sharing a home. The home co-pilot sits at the center of the experience: it can explain a lease, help estimate move-in costs, answer from household records, and prepare practical house updates for a person to confirm.

## What is implemented

- **Home co-pilot:** OpenAI Responses API with household context, short conversational history, lease-summary context, and current web search for legal questions after the household sets a state.
- **Lease guide:** sends a PDF to the configured OpenAI service, extracts dates, costs, responsibilities, and cited clauses, and saves only the extracted summary in Supabase. Goodhouse does not save the original PDF.
- **Review-before-save actions:** the agent can propose chores, shared expenses, house-rule suggestions, checklist changes, repair logs, and budget estimates. A roommate reviews and confirms each action before it is written.
- **Household sync:** Supabase Auth and shared database records for chores, expenses, house rules, details, repair notes, move-in checklist, budget, lease summaries, and deposit-vault photos.
- **Deposit vault:** photos are compressed, stored in a private Supabase Storage bucket, and served to household members using short-lived signed links.
- **U.S. renter guidance:** each house can set a state and city/county. The app distinguishes what a lease says from what local law may say and links to [USA.gov renter resources](https://www.usa.gov/tenant-rights).
- **PWA:** installable on phones after the Node app is hosted at an HTTPS address. The app shell can open offline; private API data is deliberately not cached.

## Run a local preview

Use Node.js 20 or newer.

```sh
npm install
npm start
```

Open <http://localhost:3000>. Without environment variables, the app stays in local preview mode and uses sample household data in this browser.

## Turn on OpenAI and Supabase

1. Create a Supabase project. In **Project Settings → API**, copy the project URL, the public anon/publishable key, and the service-role key.
2. In Supabase **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) once. It creates the household tables, row-level security policies, and a private `deposit-vault` storage bucket.
3. In Supabase **Authentication → URL Configuration**, set the local site URL to `http://localhost:3000`. Add the final deployed HTTPS address to the allowed redirect URLs after deployment. Email confirmation may be required before a new account can sign in.
4. Create an OpenAI API key. Add billing and usage limits to the OpenAI project that owns the key.
5. Copy `.env.example` to `.env`, then set `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key and OpenAI key on the server. Never put either in frontend code, GitHub, screenshots, or chat.
6. Restart with `npm start`, open the local site, choose **Connect house**, then create a household or sign in. Choose its state and city/county for renter guidance.
7. To add roommates, the owner opens the household button in the top bar and copies the 7-day invite link. A roommate opens it, signs in or creates an account, and joins that household.

The co-pilot and lease scan allow up to 30 AI requests per account per hour in this prototype. OpenAI usage is billed to the API project. The browser receives only the Supabase public key; all OpenAI calls and use of the Supabase service-role key stay in `server.js`.

## Deploy and install on a phone

Deploy this folder to a host that runs Node.js, not a static-only host. Set the same server environment values in the host’s private environment settings and set `APP_URL` to the final HTTPS address. Set the matching address in Supabase Authentication’s Site URL and Redirect URLs. Do not deploy `.env` or expose the service-role key.

Then open the HTTPS address on your phone:

- **iPhone:** open in Safari → Share → **Add to Home Screen** → enable **Open as Web App** → Add.
- **Android:** open in Chrome → menu → **Install app** → Install.

## Privacy and limits

- The lease PDF is sent to your configured server and OpenAI for analysis. Goodhouse stores the extracted lease summary in Supabase, not the PDF itself. Review the OpenAI account’s data controls before uploading a real lease.
- Household data uses server-side membership checks and Supabase row-level security. Keep household details intentional: invite links grant access to shared records and expire after seven days.
- Lease explanations and move-in budgets are educational estimates. Confirm important terms against the source document and current official local resources. The co-pilot must not decide if a lease clause is enforceable, advise someone to withhold rent, or send legal notices.
- The co-pilot only proposes the supported actions listed above. It does not send messages, contact landlords, initiate payments, or make legal or financial decisions.
- House-rule voting, push notifications, scheduled reminders, payment transfers, and landlord-ready export are not implemented yet.
