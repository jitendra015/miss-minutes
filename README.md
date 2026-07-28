# Miss Minutes

Miss Minutes is a human-centered conversational assistant.

## Development

```bash
npm install
npm run dev:vercel
```

`npm run dev:vercel` runs the Vite app and the Vercel Function together, so chat requests reach `api/chat.js`. `npm run dev` remains available for UI-only development.

## Production build

```bash
npm run build
```

## Vercel

This project is ready for Vercel. Import `jitendra015/miss-minutes` in Vercel and leave the detected settings as:

- Build command: `npm run build`
- Publish directory: `dist`

Vercel automatically discovers the `api/` directory and deploys `api/chat.js` as `/api/chat`.

## Assistant architecture

- `src/App.tsx` — conversation interface
- `src/hooks/useAssistant.ts` — conversation state and orchestration
- `src/core/assistant.ts` — local response engine, replaceable with an AI provider
- `src/core/memory.ts` — on-device user preference memory
- `src/types/assistant.ts` — shared conversation types
- `api/` — secure server-side boundary for AI and weather calls

No API key is stored in the browser. When an AI provider is added, its key must be set as a Vercel environment variable and used only inside a function.

## Activate the AI service

1. Create an OpenAI API key in your OpenAI Platform account.
2. In Vercel, open the project **Settings > Environment Variables** and add `OPENAI_API_KEY` for Production (and Preview/Development if needed).
3. Optionally add `OPENAI_MODEL` to choose a model enabled for that OpenAI project. The default is `gpt-5.6-luna`.
4. Redeploy the site.

The web app calls a Vercel Function, which uses the key securely. If the function is unavailable, misconfigured, or OpenAI returns an error, the UI displays the error rather than pretending that a local response came from the AI service.

## Learning and improvement

Miss Minutes uses an LLM through the OpenAI Responses API when `OPENAI_API_KEY` is configured. It learns only from controls you use: preferred reply style and helpful/not-helpful feedback are stored locally in your browser and used as limited context for later requests. It does not silently fine-tune a model, upload conversation archives, alter source code, or make external changes on its own.

## Available live skills

- **Weather** — ask “What is the weather in Mumbai?” The app securely looks up the city and current conditions through Open-Meteo. No personal API key is required for this initial integration.
- **Voice** — use the microphone button to dictate a message, and “Read latest reply aloud” for spoken responses in compatible browsers.
- **Reminders** — say “Remind me in 10 minutes to take a break.” Reminders are stored locally on the device and may send a browser notification when enabled.

Other services will be added as distinct, permission-based skills. Calendar, email, messaging, payments, and other personal-account actions must use the account owner's explicit connection and approval.
