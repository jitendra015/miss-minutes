# Assistant service boundary

Future AI-provider calls belong in this directory, not in the browser code. This keeps API keys private when deployed on Netlify.

The browser currently uses `src/core/assistant.ts` as a local development response engine. Replace that engine with a call to a Netlify function once an AI provider and its account credentials are configured.
