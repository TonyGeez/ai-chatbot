# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat SDK is a Next.js-based AI chatbot application using the Vercel AI SDK with multi-provider LLM support (OpenRouter, Anthropic, Google, xAI, OpenAI). It features document creation (artifacts), database-persisted chat history, and authentication.

## Key Technologies

- **Next.js**: 16.0.10 with App Router (React 19)
- **Database**: Neon Serverless Postgres with Drizzle ORM
- **Authentication**: Auth.js (NextAuth.js 5.0.0-beta)
- **AI**: Vercel AI SDK 6.0.0-beta (streaming, tools, custom UI events)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Linting**: Biome via `ultracite` wrapper
- **Testing**: Playwright for e2e tests

## Common Commands

### Development
```bash
pnpm dev                    # Run dev server with Turbopack
pnpm build                  # Build for production (runs DB migrations)
pnpm start                  # Start production server
```

### Code Quality
```bash
pnpm lint                   # Run ultracite (Biome) linter
pnpm format                 # Auto-fix lint issues
```

### Database
```bash
pnpm db:migrate            # Run pending migrations
pnpm db:generate           # Generate migration files
pnpm db:studio             # Launch Drizzle Studio UI
pnpm db:push               # Push schema changes without migrations
```

### Testing
```bash
pnpm test                  # Run Playwright e2e tests
```

### Running a Single Test
```bash
pnpm exec playwright test tests/e2e/[test-file].spec.ts
```

## Architecture

### App Router Structure
- `app/(chat)/` - Chat interface routes (`/`, `/chat/[id]`)
- `app/(auth)/` - Authentication routes (`/login`, `/register`)
- `app/(chat)/api/chat/` - AI chat API endpoint with streaming support
- `app/(chat)/api/chat/[id]/stream/` - Per-chat streaming endpoint
- `app/(chat)/api/files/upload/` - File upload handler

### Database Schema (`lib/db/schema.ts`)
Core tables:
- `User` - Authentication records
- `Chat` - Chat sessions with visibility (public/private)
- `Message_v2` - Messages with parts/attachments (new schema)
- `Document` - Created artifacts (text/code/sheet/image)
- `Suggestion` - Document suggestions with foreign key to Document
- `Vote_v2` - Message upvotes/downvotes

Note: `Message` and `Vote` tables are deprecated and being migrated to `_v2` suffix versions.

### AI Integration (`lib/ai/`)
- `providers.ts` - Model provider configuration (OpenRouter with fallback to mock models in test environment)
- `models.ts` - Chat model definitions and metadata
- `tools/` - AI tools (create-document, update-document, request-suggestions, get-weather)
- `prompts.ts` - System prompts for different artifact types

### Artifacts System (`artifacts/` and `lib/artifacts/`)
Documents/artifacts are created through AI tools with handlers for each type:
- `text/` - Rich text documents
- `code/` - Code editor with syntax highlighting
- `sheet/` - Spreadsheet with CSV parsing
- `image/` - Image generation and editing

Each handler implements `onCreateDocument` and `onUpdateDocument` for AI tool integration.

### Component Architecture
- `components/chat.tsx` - Main chat interface
- `components/artifact.tsx` - Artifact display and editor
- `components/multimodal-input.tsx` - Message input with file attachment support
- `components/message.tsx` - Individual message rendering
- `components/ui/` - shadcn/ui components (do not modify directly)

### Streaming and Real-time Updates
Uses AI SDK's `UIMessageStreamWriter` with custom data types (`CustomUIDataTypes` in `lib/types.ts`):
- `data-kind` - Artifact type
- `data-id` - Artifact ID
- `data-title` - Artifact title
- `data-clear` - Clear artifact UI
- `data-finish` - Signal completion
- Application-specific types: `textDelta`, `codeDelta`, `sheetDelta`, `suggestion`

### Environment Variables
Required variables (see `.env.example`):
- `POSTGRES_URL` - Database connection
- `NEXTAUTH_SECRET` - Auth.js secret
- `OPENROUTER_API_KEY` - AI model provider access
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage (for file uploads)
- `AI_GATEWAY_API_KEY` - Required for non-Vercel deployments

## Code Conventions and Linting

The project uses `ultracite` (Biome wrapper) with strict rules configured in `biome.jsonc`. Key conventions:

- **No `console.log`** except in error handling - disable the `noConsole` rule temporarily if needed
- **No `any` type** - strict TypeScript with `strictNullChecks: true`
- **No enums** - use unions or objects instead
- **Accessibility-first** - follow a11y rules from `.cursor/rules/ultracite.mdc`
- **React best practices** - no nested components, proper hook dependencies, explicit return types
- **File imports**: Use `@/` alias for root-relative imports (configured in tsconfig.json)

Run `pnpm lint` frequently to catch issues early.

## Important Implementation Notes

### Model Configuration
Models are accessed through OpenRouter by default. The system uses `getLanguageModel()` in `lib/ai/providers.ts` which:
- Returns mock models in test environments (`isTestEnvironment` check)
- Wraps reasoning models with `extractReasoningMiddleware` for `<thinking>` tag extraction
- Falls back to OpenRouter for all model requests

### Message Parts Schema
The application is migrating from legacy `content` field to new `parts` + `attachments` structure in `Message_v2` table. Messages support multiple content types through the parts system.

### Artifact Handlers
When adding new artifact types:
1. Add to `artifactKinds` array
2. Create handler in `lib/artifacts/server.ts`
3. Implement `onCreateDocument` and `onUpdateDocument`
4. Add client-side editor in `components/` (text-editor, code-editor, sheet-editor, etc.)
5. Update `create-document.ts` tool to reference the new handler

### Testing
Tests use Playwright with fixtures in `tests/fixtures.ts`. Test environment detection via `isTestEnvironment` constant uses `PLAYWRIGHT=True` env var (set automatically by `pnpm test`).
