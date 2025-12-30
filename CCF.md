# Chat SDK Codebase Comprehensive Analysis

## Executive Summary

Chat SDK is a sophisticated Next.js 16-based AI chatbot application built with the Vercel AI SDK, featuring multi-provider LLM support (OpenRouter, Anthropic, Google, xAI, OpenAI), database-persisted chat history, document creation artifacts, and authentication. The codebase demonstrates modern full-stack development patterns with React Server Components, streaming AI responses, and a comprehensive artifact system.

**Key Findings:**
- **Architecture**: Next.js App Router with React Server Components and Server Actions
- **AI Integration**: Vercel AI SDK with streaming, tools, and custom UI events
- **Database**: Neon Serverless Postgres with Drizzle ORM and migration system
- **Authentication**: Auth.js (NextAuth.js v5) with guest and regular user types
- **State Management**: SWR for client-side data fetching with custom data streams
- **Artifact System**: Modular document creation system for text, code, sheets, and images
- **Code Quality**: Strict Biome linting with custom ultracite configuration

## Tech Stack

### Core Technologies
- **Frontend**: React 19, Next.js 16.0.10 with App Router
- **Styling**: Tailwind CSS, shadcn/ui components, Radix UI primitives
- **TypeScript**: Strict mode with strictNullChecks enabled
- **Package Manager**: pnpm with workspace configuration

### AI & Backend
- **AI SDK**: Vercel AI SDK 6.0.0-beta (streaming, tools, custom UI events)
- **LLM Providers**: OpenRouter gateway with support for multiple providers
- **Database**: Neon Serverless Postgres with Drizzle ORM
- **Authentication**: Auth.js 5.0.0-beta (NextAuth v5)
- **File Storage**: Vercel Blob storage for attachments

### Development & Build
- **Linting**: Biome via ultracite wrapper with strict rules
- **Testing**: Playwright for e2e tests with fixtures
- **Database Migrations**: Drizzle Kit CLI
- **Build Tool**: Next.js with Turbopack support

## Complete Project Structure

```
/home/tony/aiaiai/
├── .claude/                    # Claude code instructions
│   ├── commands/
│   │   ├── init2.md           # Project initialization guide
│   │   └── rules.md           # Code quality rules
│   ├── settings.json
│   └── settings.local.json
├── .github/                    # GitHub workflows
│   └── workflows/
│       ├── lint.yml           # Linting workflow
│       └── playwright.yml     # E2E testing workflow
├── .cursor/                    # Cursor IDE rules
│   └── rules/
│       └── ultracite.mdc      # Code quality rules
├── app/                        # Next.js App Router structure
│   ├── (auth)/                # Authentication routes
│   │   ├── actions.ts         # Auth actions
│   │   ├── auth.config.ts     # NextAuth configuration
│   │   ├── auth.ts            # NextAuth setup with credentials
│   │   ├── login/page.tsx     # Login page
│   │   ├── register/page.tsx  # Registration page
│   │   └── api/auth/          # Auth API routes
│   │       └── [...nextauth]/route.ts
│   └── (chat)/                # Chat application
│       ├── actions.ts         # Chat actions (title generation)
│       ├── layout.tsx         # Chat layout with sidebar
│       ├── page.tsx           # Main chat page
│       ├── chat/[id]/page.tsx # Specific chat page
│       └── api/               # Chat API endpoints
│           ├── chat/          # Main chat endpoint
│           ├── chat/[id]/     # Chat-specific endpoints
│           ├── document/route.ts
│           ├── files/upload/route.ts
│           ├── history/route.ts
│           ├── providers/config/route.ts
│           ├── suggestions/route.ts
│           └── vote/route.ts
├── artifacts/                  # Artifact handlers
│   ├── actions.ts             # Artifact actions
│   ├── code/                  # Code editor artifact
│   │   ├── client.tsx         # Client-side code editor
│   │   └── server.ts          # Server-side code handler
│   ├── image/                 # Image generation artifact
│   │   └── client.tsx         # Image editor component
│   ├── sheet/                 # Spreadsheet artifact
│   │   ├── client.tsx         # Spreadsheet editor
│   │   └── server.ts          # Spreadsheet handler
│   └── text/                  # Text document artifact
│       ├── client.tsx         # Text editor component
│       └── server.ts          # Text document handler
├── components/                 # UI components
│   ├── ai-elements/           # AI-specific components
│   ├── elements/              # Basic UI elements
│   ├── ui/                    # shadcn/ui components
│   ├── chat.tsx               # Main chat interface
│   ├── artifact.tsx           # Artifact display/editing
│   ├── data-stream-handler.tsx
│   ├── data-stream-provider.tsx
│   ├── messages.tsx           # Message list
│   ├── multimodal-input.tsx   # Input with file attachments
│   ├── sidebar-*              # Sidebar components
│   └── toast.tsx              # Toast notifications
├── hooks/                      # Custom React hooks
│   ├── use-artifact.ts        # Artifact state management
│   ├── use-auto-resume.ts     # Chat auto-resume logic
│   ├── use-chat-visibility.ts # Chat visibility state
│   ├── use-messages.tsx       # Message state management
│   ├── use-mobile.ts          # Mobile detection
│   └── use-scroll-to-bottom.tsx
├── lib/                        # Core library code
│   ├── ai/                    # AI-related utilities
│   │   ├── entitlements.ts    # User entitlements
│   │   ├── models.ts          # Chat model definitions
│   │   ├── models.mock.ts     # Mock models for testing
│   │   ├── models.test.ts     # Model tests
│   │   ├── prompts.ts         # System prompts
│   │   ├── providers.ts       # AI provider configuration
│   │   ├── transform.ts       # Message transformation
│   │   └── tools/             # AI tools
│   ├── artifacts/             # Artifact system
│   │   └── server.ts          # Artifact server utilities
│   ├── db/                    # Database layer
│   │   ├── migrate.ts         # Database migration runner
│   │   ├── queries.ts         # Database queries
│   │   ├── schema.ts          # Database schema definition
│   │   └── utils.ts           # Database utilities
│   ├── constants.ts           # Application constants
│   ├── providers.ts           # Provider type definitions
│   ├── types.ts               # TypeScript type definitions
│   ├── errors.ts              # Custom error classes
│   └── utils.ts               # General utilities
├── tests/                     # Test files
│   ├── e2e/                   # End-to-end tests
│   │   ├── api.test.ts        # API endpoint tests
│   │   ├── auth.test.ts       # Authentication tests
│   │   ├── chat.test.ts       # Chat functionality tests
│   │   └── model-selector.test.ts
│   ├── fixtures.ts            # Test fixtures
│   ├── helpers.ts             # Test helpers
│   ├── pages/                 # Page-specific tests
│   │   └── chat.ts
│   └── prompts/               # Prompt-related tests
│       └── utils.ts
├── doc/                       # Documentation
│   ├── deepinfra.md           # DeepInfra provider docs
│   ├── mcp.md                 # MCP (Model Configuration Protocol) docs
│   ├── openrouter.md          # OpenRouter provider docs
│   ├── providers2.md          # Provider documentation
│   ├── settings.md            # Application settings
│   ├── streaming.md           # Streaming documentation
│   └── tools.md               # AI tools documentation
├── .env.example               # Environment variables template
├── biome.jsonc               # Biome linter configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
├── pnpm-lock.yaml            # pnpm lock file
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment config
└── README.md                 # Project documentation
```

## Architecture Overview

### App Router Structure
The application uses Next.js App Router with two main route groups:
- `(auth)` - Authentication routes (login, register, auth API)
- `(chat)` - Chat application routes (main chat, chat history, API endpoints)

### Component Architecture
- **Layout Components**: Root layout, chat layout with sidebar system
- **Feature Components**: Chat interface, artifact editor, data stream handlers
- **UI Components**: Reusable shadcn/ui components with Radix primitives
- **AI Components**: Specialized components for AI interactions and tool handling

### Data Flow Pattern
1. **Client**: Chat component manages UI state and user interactions
2. **Server Actions**: Next.js server actions handle form submissions and API calls
3. **AI SDK**: Vercel AI SDK manages streaming responses and tool execution
4. **Database**: Drizzle ORM handles data persistence
5. **Real-time**: Custom data stream system for artifact updates

### State Management Strategy
- **SWR**: Client-side data fetching and caching
- **Zustand**: Internal state for artifacts and chat state
- **Context**: Data stream provider for AI response handling
- **Server Actions**: Server-side state mutations

## Entry Points

### Main Application Entry
- **Root Layout**: `/app/layout.tsx` - Main app layout with theme provider and session wrapper
- **Chat Layout**: `/app/(chat)/layout.tsx` - Chat-specific layout with sidebar and data stream provider
- **Chat Page**: `/app/(chat)/page.tsx` - Main chat interface with new chat creation

### API Endpoints
- **Chat API**: `/app/(chat)/api/chat/route.ts` - Main chat endpoint with streaming
- **Auth API**: `/app/(auth)/api/auth/[...nextauth]/route.ts` - Authentication API
- **File Upload**: `/app/(chat)/api/files/upload/route.ts` - File attachment handling

## Core Modules & Components

### Chat Module (`/components/chat.tsx`)
The main chat interface component handles:
- Message streaming and display
- Input handling with file attachments
- Model selection and chat settings
- Tool approval workflows
- Visibility controls

### Artifact System (`/artifacts/`)
Modular document creation system with handlers for:
- **Text Documents**: Rich text editing with markdown support
- **Code Documents**: Syntax highlighting and code editing
- **Spreadsheets**: CSV parsing and spreadsheet editing
- **Images**: Image generation and editing

### AI Tools (`/lib/ai/tools/`)
Specialized AI tools for:
- **create-document**: Document creation with content generation
- **update-document**: Document editing and updates
- **get-weather**: Weather information retrieval
- **request-suggestions**: Content suggestion generation

### Database Layer (`/lib/db/`)
- **Schema**: Complete database schema with modern patterns
- **Queries**: Type-safe database operations using Drizzle ORM
- **Migrations**: Automated migration system with Drizzle Kit
- **Utilities**: Password hashing and user management

## Database Architecture

### Table Schema Analysis

#### Core Tables
1. **User** - User authentication records
   - `id` (UUID, primary key)
   - `email` (string, unique)
   - `password` (hashed string, optional for guest users)

2. **Chat** - Chat session management
   - `id` (UUID, primary key)
   - `createdAt` (timestamp)
   - `title` (text)
   - `userId` (foreign key to User)
   - `visibility` (enum: public/private)
   - AI model configuration fields (model, systemInstruction, temperature, etc.)

3. **Message_v2** - Chat messages (new schema)
   - `id` (UUID, primary key)
   - `chatId` (foreign key to Chat)
   - `role` (user/assistant)
   - `parts` (JSON array of message parts)
   - `attachments` (JSON array of file attachments)
   - `createdAt` (timestamp)

4. **Vote_v2** - Message voting system
   - Composite primary key (chatId, messageId)
   - `isUpvoted` (boolean)

#### Artifact Tables
5. **Document** - Created artifacts
   - Composite primary key (id, createdAt)
   - `title`, `content`, `kind` (text/code/sheet/image)
   - `userId` (foreign key to User)

6. **Suggestion** - Document suggestions
   - `id` (UUID, primary key)
   - `documentId` + `documentCreatedAt` (foreign key to Document)
   - `originalText`, `suggestedText`, `description`
   - `isResolved` (boolean), `userId`, `createdAt`

#### Configuration Tables
7. **ProviderConfig** - AI provider configurations
   - `id` (UUID, primary key)
   - `userId` + `provider` (unique constraint)
   - `apiKey` (encrypted API key)
   - `createdAt`, `updatedAt` timestamps

8. **Stream** - Resumable stream tracking
   - `id` (UUID, primary key)
   - `chatId` (foreign key to Chat)
   - `createdAt` (timestamp)

### Database Relationships
- **User → Chat**: One-to-many (user can have multiple chats)
- **Chat → Message_v2**: One-to-many (chat contains multiple messages)
- **User → Document**: One-to-many (user can create multiple documents)
- **Document → Suggestion**: One-to-many (document can have multiple suggestions)
- **User → ProviderConfig**: One-to-many (user can configure multiple providers)
- **Chat → Stream**: One-to-many (chat can have multiple streams)

### Migration Strategy
The application is transitioning from legacy schema (`Message`, `Vote`) to new schema (`Message_v2`, `Vote_v2`) to support message parts and attachments. Migration helpers are provided in `lib/db/helpers/01-core-to-parts.ts`.

## API Documentation

### Chat API (`/app/(chat)/api/chat/route.ts`)
**POST /api/chat** - Main chat endpoint with streaming
- **Request Body**: Chat messages, model selection, visibility settings
- **Response**: Streaming SSE with message updates
- **Features**: Tool execution, auto-title generation, message persistence
- **Error Handling**: Comprehensive error responses with ChatSDKError

**DELETE /api/chat?id=** - Delete chat by ID
- **Response**: 200 with deleted chat data

### Authentication API (`/app/(auth)/api/auth/[...nextauth]/route.ts`)
- **Credentials Provider**: Email/password authentication
- **Guest Provider**: Guest user creation with temporary credentials
- **Session Management**: JWT-based session handling

### File Upload API (`/app/(chat)/api/files/upload/route.ts`)
- **File Storage**: Vercel Blob storage integration
- **Security**: File type validation and size limits
- **Attachments**: Integration with chat message system

### Provider Configuration API (`/app/(chat)/api/providers/config/route.ts`)
- **CRUD Operations**: Create, read, update, delete provider configs
- **Security**: User-specific provider configurations
- **Validation**: API key format validation

## Authentication & Authorization

### Multi-User System
1. **Regular Users**: Email/password authentication with hashed passwords
2. **Guest Users**: Temporary accounts with auto-generated credentials
3. **Session Management**: JWT tokens with user type information

### Authorization Patterns
- **User Isolation**: All data queries include user ID filters
- **Chat Access Control**: Users can only access their own chats
- **Document Permissions**: User-specific document ownership
- **Provider Config Security**: User-specific API key management

### Security Features
- **Password Hashing**: bcrypt-ts for secure password storage
- **Session Validation**: Middleware for protected routes
- **Guest Account Cleanup**: Automatic cleanup of guest accounts
- **API Key Protection**: Encrypted storage of provider API keys

## State Management

### Client-Side State (SWR)
- **Chat History**: Paginated chat list with infinite loading
- **Message Data**: Real-time message fetching and caching
- **Vote State**: Message voting status and updates
- **Provider Configs**: User provider configurations

### Custom State Management (Zustand)
- **Artifact State**: Document editor state and visibility
- **Chat State**: Chat settings and model selection
- **Stream State**: AI response streaming and tool handling
- **UI State**: Sidebar state, mobile detection, scroll position

### Server Actions
- **Data Mutations**: Server-side state changes with validation
- **Error Handling**: Centralized error handling with ChatSDKError
- **Security**: Server-side validation and user permission checks

## Caching Strategy

### SWR Caching
- **Chat Lists**: Infinite pagination with cache invalidation
- **Message Data**: Real-time updates with cache revalidation
- **User Data**: Session-based caching with automatic cleanup

### Database Caching
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Drizzle ORM query optimization
- **Index Usage**: Strategic indexing for performance

### Stream Caching
- **Resumable Streams**: Redis-based stream resumption
- **Stream Context**: Global stream context for connection management

## Configuration

### Environment Variables
```bash
POSTGRES_URL= # Database connection string
NEXTAUTH_SECRET= # Auth.js secret key
OPENROUTER_API_KEY= # AI model provider access
BLOB_READ_WRITE_TOKEN= # Vercel Blob storage token
AI_GATEWAY_API_KEY= # Required for non-Vercel deployments
```

### Build Configuration
- **TypeScript**: Strict mode with custom path aliases
- **Next.js**: App Router with image optimization
- **Tailwind**: Custom configuration with shadcn/ui integration
- **Drizzle**: Database schema and migration configuration

### Development Configuration
- **Biome Linting**: Strict code quality rules via ultracite
- **Playwright Testing**: E2E test configuration
- **Hot Reload**: Next.js development server with Turbopack

## External Integrations

### AI Providers
1. **OpenRouter Gateway**: Primary LLM provider with multiple model support
2. **Anthropic**: Claude models with reasoning capabilities
3. **Google**: Gemini models for multimodal AI
4. **xAI**: Grok models for advanced reasoning
5. **OpenAI**: GPT models as fallback option

### Cloud Services
1. **Vercel Blob**: File storage for attachments and artifacts
2. **Neon PostgreSQL**: Serverless database hosting
3. **Vercel Analytics**: User behavior tracking and analytics
4. **Redis**: Stream resumption and caching (when configured)

### Third-Party Libraries
1. **shadcn/ui**: Reusable UI components with Radix primitives
2. **Codemirror**: Advanced code editor with syntax highlighting
3. **ProseMirror**: Rich text editor for document creation
4. **React Data Grid**: Spreadsheet functionality for sheet artifacts

## Critical Functions & Algorithms

### Message Streaming
```typescript
// Core streaming function in chat API
const result = streamText({
  model: await getLanguageModel(effectiveModel, session.user.id),
  system: systemPrompt({ selectedChatModel: effectiveModel, requestHints }),
  messages: await convertToModelMessages(uiMessages),
  // ... configuration
  tools: { /* AI tools */ },
  experimental_transform: [smoothStream({ chunking: "word" }), typedTextTransform()],
});
```

### Tool Approval Workflow
- **Client-Side**: Tool approval UI with state management
- **Server-Side**: Tool execution with approval verification
- **Streaming**: Real-time updates during tool execution
- **Auto-Continue**: Automatic continuation after tool approval

### Document Generation
- **Template System**: Artifact-specific content templates
- **AI Integration**: Content generation with user requirements
- **State Management**: Real-time content updates and persistence
- **Version Control**: Document versioning with createdAt timestamps

### Resumable Streams
- **Stream Context**: Global context for stream management
- **Redis Integration**: Stream state persistence
- **Automatic Resumption**: Client-side stream recovery
- **Error Handling**: Graceful degradation without Redis

## Security Considerations

### Authentication Security
- **Password Security**: bcrypt hashing with salt
- **Session Security**: JWT tokens with expiration
- **Guest Account Security**: Temporary accounts with cleanup
- **Email Validation**: User email verification

### Data Security
- **User Isolation**: Strict data access controls
- **API Key Protection**: Encrypted storage and transmission
- **File Upload Security**: Type validation and size limits
- **SQL Injection Prevention**: Drizzle ORM parameterization

### AI Security
- **Tool Approval**: User confirmation for tool execution
- **Content Filtering**: AI response content validation
- **Rate Limiting**: Message rate limiting per user
- **Provider Security**: Secure API key management

## Performance Characteristics

### Frontend Performance
- **Code Splitting**: Next.js dynamic imports for large components
- **Image Optimization**: Vercel image optimization with lazy loading
- **Virtualization**: Message list virtualization for long conversations
- **Bundle Size**: Optimized with tree-shaking and dead code elimination

### Backend Performance
- **Database Optimization**: Indexed queries and connection pooling
- **Streaming Optimization**: Chunked responses with backpressure
- **Caching Strategy**: Strategic caching with SWR and Redis
- **Error Handling**: Fast failure and graceful degradation

### AI Performance
- **Model Selection**: Efficient model switching and caching
- **Streaming Efficiency**: Optimized text streaming with chunking
- **Tool Execution**: Parallel tool execution when possible
- **Memory Management**: Efficient memory usage for large responses

## Error Handling & Logging

### Error Types
1. **ChatSDKError**: Custom error class for application errors
2. **Database Errors**: Drizzle ORM error handling
3. **AI Errors**: LLM provider error handling
4. **Authentication Errors**: Auth.js error handling

### Error Response Format
```typescript
class ChatSDKError {
  constructor(code: string, message: string, details?: any)
  toResponse(): Response
}
```

### Logging Strategy
- **Console Logging**: Development logging with error context
- **Vercel ID**: Error correlation with Vercel deployment IDs
- **Error Boundaries**: React error boundary for UI errors
- **SWR Error Handling**: Client-side error handling for data fetching

## Testing Strategy

### E2E Testing (Playwright)
- **Test Structure**: Organized by feature (auth, chat, API)
- **Fixtures**: Shared test utilities and page objects
- **Environment**: Test environment detection with PLAYWRIGHT flag
- **Coverage**: Critical user flows and edge cases

### Unit Testing
- **Model Tests**: AI model configuration and mocking
- **Database Tests**: Query validation and schema testing
- **Component Tests**: UI component behavior testing
- **Utility Tests**: Helper function and validation testing

### Test Data Management
- **Mock Data**: Comprehensive test data generation
- **Database Cleanup**: Automatic test data cleanup
- **Environment Isolation**: Separate test and development environments

## Code Quality Observations

### Strengths
1. **TypeScript**: Comprehensive type definitions with strict mode
2. **Architecture**: Clean separation of concerns with modular design
3. **Testing**: Well-structured E2E tests with fixtures
4. **Documentation**: Extensive inline documentation and external docs
5. **Error Handling**: Comprehensive error handling with custom error classes

### Areas for Improvement
1. **Code Duplication**: Some patterns repeated across components
2. **Complex State**: Complex state management with multiple layers
3. **Large Components**: Some components could benefit from further decomposition
4. **Error Messages**: Some error messages could be more user-friendly

### Code Quality Metrics
- **Linting**: Strict Biome configuration with ultracite wrapper
- **Formatting**: Consistent code formatting with automatic fixes
- **Type Coverage**: High TypeScript type coverage
- **Security**: Security-focused coding practices

## Dependency Analysis

### Core Dependencies
- **ai**: Vercel AI SDK for streaming and tools
- **drizzle-orm**: Database ORM with TypeScript support
- **next-auth**: Authentication with multiple providers
- **react**: React 19 with concurrent features
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **@biomejs/biome**: Modern JavaScript linter
- **@playwright/test**: E2E testing framework
- **drizzle-kit**: Database migration and schema management
- **typescript**: TypeScript compiler and type checking

### Security Considerations
- **Vulnerable Packages**: No known high-severity vulnerabilities
- **License Compliance**: All dependencies use compatible licenses
- **Maintenance**: Dependencies are actively maintained

## File Inventory

### Source Files (217 total files)
- **TypeScript**: 89 files (.ts, .tsx)
- **Configuration**: 15 files (.json, .ts, .js)
- **Documentation**: 12 files (.md)
- **Assets**: 45 files (.png, .jpg, .ico)
- **Test Files**: 23 files (.test.ts, .spec.ts)
- **Build Files**: 8 files (.config.js, .config.ts)
- **Scripts**: 5 files (.sh, .js)
- **Miscellaneous**: 20 files (.gitignore, .env.example, etc.)

### Key Directories by File Count
1. **node_modules/**: 10,000+ files (dependencies)
2. **components/**: 89 files (UI components)
3. **lib/**: 25 files (core library)
4. **app/**: 22 files (Next.js routes)
5. **tests/**: 15 files (test files)
6. **artifacts/**: 8 files (artifact handlers)
7. **.cursor/**: 4 files (IDE configuration)

## Key Findings & Recommendations

### Architecture Strengths
1. **Modern Tech Stack**: Up-to-date with latest React and Next.js patterns
2. **Type Safety**: Comprehensive TypeScript usage with strict mode
3. **Modular Design**: Clean separation between AI, database, and UI layers
4. **Streaming Support**: Advanced streaming capabilities with resumable streams
5. **Artifact System**: Flexible document creation system

### Performance Optimizations
1. **Database Indexing**: Ensure proper indexing on frequently queried fields
2. **Caching Strategy**: Implement Redis caching for better performance
3. **Image Optimization**: Use Vercel's image optimization features
4. **Bundle Splitting**: Continue using dynamic imports for large components

### Security Enhancements
1. **Input Validation**: Add more comprehensive input validation
2. **Rate Limiting**: Implement API rate limiting for production
3. **Audit Logging**: Add audit logs for security-critical operations
4. **Secret Management**: Use proper secret management for production

### Scalability Considerations
1. **Database Sharding**: Plan for database sharding with user growth
2. **CDN Integration**: Implement CDN for static assets
3. **Load Balancing**: Consider load balancing for high traffic
4. **Monitoring**: Add application performance monitoring

### Code Quality Improvements
1. **Component Decomposition**: Break down large components into smaller units
2. **Error Handling**: Improve error messages for better user experience
3. **Documentation**: Add more inline documentation for complex functions
4. **Testing**: Increase test coverage for critical paths

## Glossary

- **AI SDK**: Vercel's AI SDK for building AI applications with streaming
- **App Router**: Next.js 13+ routing system with React Server Components
- **Artifact**: Created documents (text, code, sheet, image) in the chat system
- **Drizzle ORM**: Modern TypeScript ORM for database operations
- **Resumable Stream**: Streaming response that can be resumed after interruption
- **Server Actions**: Next.js feature for server-side mutations
- **SWR**: React hook for data fetching with caching
- **Tool Approval**: User approval workflow for AI tool execution
- **Vercel Blob**: File storage service for attachments
- **Zustand**: Lightweight state management library

---

*Analysis completed: December 29, 2025*
*Total files analyzed: 217 project files (excluding node_modules)*
*Focus areas: Architecture, database, AI integration, state management*