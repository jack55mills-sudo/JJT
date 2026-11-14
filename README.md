# Goodhouse

A small, interactive prototype for **Willow House**, a shared home for four roommates. It focuses on the everyday loop: agree on expectations, know whose turn it is, keep house details handy, and log shared costs.

## Run it

For the PWA to register its service worker, serve the files over HTTPS or localhost. From this folder, run python3 -m http.server 8000 and open http://localhost:8000.

To install on a phone, the app must be deployed to an HTTPS host first. On iPhone, open its URL in Safari, tap Share, choose Add to Home Screen, turn on Open as Web App, and tap Add. On Android, open its URL in Chrome, tap the menu, choose Install app, then Install.

## Try the prototype

- Move between Overview, Chore rhythm, Our agreement, House details, Deposit vault, and Shared costs.
- Mark a chore complete or send a gentle, optionally anonymous flag.
- Add a chore, suggest a house rule, log an expense, update a few house details, or save a move-in photo.
- Changes are saved in this browser with localStorage. Clear this site's browser storage to reset the seeded demo household.
- The app shell is cached for offline launch after the first online visit. Data remains local to each browser and does not sync between roommates.

## Scope

This is a front-end demo with seeded sample data. It does not yet have accounts, shared cloud sync, real roommate notifications, AI-written compromises, scheduled reminders, payment links, or a landlord export. Each browser has its own local copy.

GitHub Pages has not been configured. This repository is private; on GitHub Free, Pages requires a public repository, and Pages sites are public by default. Choose hosting deliberately before publishing household information.
