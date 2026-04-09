# Interactive AI Resume Flow — Design

## Goal
- Provide a new, interactive "Generate Resume with AI" flow that asks the user guided questions, iteratively produces and refines resume sections, and creates a non-destructive resume draft the user can edit in the existing resume editor.

## Principles
- Non-destructive: do not overwrite existing resumes unless the user explicitly replaces one.
- Sectional & iterative: generate resume by sections (Summary, Experience, Education, Skills, Projects, Certifications), allow per-section regeneration/refinement.
- Server-side LLM calls: keep API keys off the client by proxying LLM requests to server endpoints.
- Consent & moderation: obtain explicit consent before sending personal data to the AI provider.
- Rate-limited and auditable: basic rate limiting and prompt hash logging for debugging and billing.

## User flow (ideal)
1. Entry: user clicks "Generate Resume with AI" at /resumes or /resume/new → lands on `/resume/generate-ai` page.
2. Consent: show short privacy notice + checkbox to consent to sending personal data to the AI provider.
3. Q&A wizard: a focused sequence of prompts (see below). User can skip, paste existing details, or answer briefly.
4. Drafting: server returns a draft for the current section; client shows preview and lets user accept, edit inline, or ask for refinement.
5. Iterate: user completes all sections, then clicks "Create Draft" which calls the save endpoint and creates a new resume record (draft) in DB.
6. Edit: user is redirected to the standard resume editor to perform manual adjustments and publish.

## Minimal Q&A sequence (configurable)
- Target role/title (one line)
- Professional summary: 1–2 sentences about background and goals
- Most recent role: company, title, dates, 3 accomplishments (or freeform)
- Past roles: quick list (company, title, dates, 1–3 bullets each) or paste longer text
- Education and certifications
- Key skills and tools
- Projects / links / achievements to highlight
- Tone & length preference (concise, standard, detailed)

## Prompting strategy (server-side)
- Use small, deterministic prompts per section to minimize token usage and enable per-section regeneration.
- System instruction example:
  "You are a professional resume writer. Produce concise, achievement-focused bullet points. Use metrics when present. Output only the resume section in JSON: { text: string, bullets: string[] }."
- For refinement requests include the previous section and the user's refinement instruction.

## API contract (server)

- POST /api/resume/ai-generate
  - Body: { userId?, section: 'summary'|'experience'|'education'|'skills'|'projects'|'all', context: { role, experiences[], education[], skills[], tone?, length? }, instruction?: string }
  - Auth: require session; server derives `userId` from session if omitted.
  - Response: { section, draft: { text, bullets? }, metadata: { promptHash, tokensUsed? } }

- POST /api/resume/create-ai
  - Body: { draft: { title?, sections: { summary, experience[], education[], skills[], projects[] } }, visibility?: 'PRIVATE'|'NETWORK'|'PUBLIC' }
  - Auth: require session
  - Response: { resumeId }

## Client UI components
- `src/app/resume/generate-ai/page.tsx` — entry page + start button and consent.
- `src/components/resume/ai-resume-wizard.tsx` — conversational/stepper UI using react-query to call `/api/resume/ai-generate` per step; previews and per-section actions.
- Reuse existing `ResumePreview` and editor components for the final preview and the save action.

## Safety & operational
- Consent checkbox prior to any LLM request.
- Rate-limit per user (server middleware or per-route guard) and per-IP fallback.
- Optional moderation API call on raw user inputs to redact or warn before sending.
- Persist only accepted drafts; optionally persist ephemeral chat history if user opts in for debugging.
- Add metrics: prompt hash, tokens used, timestamp.

## Testing & rollout
- Build a POC that runs on dev with a `OPENAI_API_KEY` set locally.
- Smoke tests: per-section generation, refine loop, create draft, and open in editor.
- Feature-flag rollout: gate the new route by `FEATURE_AI_RESUME=true` env var until tested.

## Next steps (implementation)
1. Scaffold `/resume/generate-ai` page and `ai-resume-wizard` component (POC).  
2. Add server endpoints `/api/resume/ai-generate` and `/api/resume/create-ai` (skeleton that returns canned responses in dev if `OPENAI_API_KEY` absent).  
3. Wire save to existing resume creation code so DB changes are non-destructive.  
4. Add consent flow, rate limit, and basic moderation.  

Reference: keep the existing resume editor at `src/app/resume/[slug]/edit` untouched and re-use its preview components.

Design created by assistant — next: scaffold POC UI + server routes on your command.
