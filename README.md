# Miss Minutes

Miss Minutes is a human-centered conversational assistant.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Netlify

This project is ready for Netlify. Import `jitendra015/miss-minutes` in Netlify and leave the detected settings as:

- Build command: `npm run build`
- Publish directory: `dist`

The `netlify.toml` file keeps these settings in the repository and handles browser routes.

## Assistant architecture

- `src/App.tsx` — conversation interface
- `src/hooks/useAssistant.ts` — conversation state and orchestration
- `src/core/assistant.ts` — local response engine, replaceable with an AI provider
- `src/core/memory.ts` — on-device user preference memory
- `src/types/assistant.ts` — shared conversation types
- `netlify/functions/` — secure boundary for future server-side AI calls

No API key is stored in the browser. When an AI provider is added, its key must be set as a Netlify environment variable and used only inside a function.

## Activate the AI service

1. Create an OpenAI API key in your OpenAI Platform account.
2. In Netlify, open the Miss Minutes site settings and add `OPENAI_API_KEY` as an environment variable.
3. Redeploy the site.

The web app calls a Netlify Function, which uses the key securely. Without the key, the app continues to work using its local development response engine.

## Learning and improvement

Miss Minutes uses an LLM through the OpenAI Responses API when `OPENAI_API_KEY` is configured. It learns only from controls you use: preferred reply style and helpful/not-helpful feedback are stored locally in your browser and used as limited context for later requests. It does not silently fine-tune a model, upload conversation archives, alter source code, or make external changes on its own.

## Available live skills

- **Weather** — ask “What is the weather in Mumbai?” The app securely looks up the city and current conditions through Open-Meteo. No personal API key is required for this initial integration.
- **Voice** — use the microphone button to dictate a message, and “Read latest reply aloud” for spoken responses in compatible browsers.
- **Reminders** — say “Remind me in 10 minutes to take a break.” Reminders are stored locally on the device and may send a browser notification when enabled.

Other services will be added as distinct, permission-based skills. Calendar, email, messaging, payments, and other personal-account actions must use the account owner's explicit connection and approval.
