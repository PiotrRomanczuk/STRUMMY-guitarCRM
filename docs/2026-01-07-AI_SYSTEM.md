# AI System Documentation

## 🤖 Overview

Guitar CRM includes a comprehensive AI system for administrative assistance. The system supports multiple AI providers and includes specialized agents for common tasks.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI System Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer                                                       │
│  └── AIAssistantCard.tsx (Dashboard component)                  │
│                                                                 │
│  Server Actions                                                 │
│  └── app/actions/ai.ts (generateAIResponse, getAvailableModels) │
│                                                                 │
│  Agent Registry                                                 │
│  └── lib/ai/agent-registry.ts (Registration & execution)        │
│  └── lib/ai/agent-specifications.ts (Agent definitions)         │
│  └── lib/ai/agent-execution.ts (Specialized wrappers)           │
│                                                                 │
│  Provider Abstraction                                           │
│  └── lib/ai/provider-factory.ts (Provider selection)            │
│  └── lib/ai/providers/openrouter.ts (Cloud API)                 │
│  └── lib/ai/providers/ollama.ts (Local LLM)                     │
│                                                                 │
│  Security                                                       │
│  └── lib/ai/rate-limiter.ts (Role-based limits)                 │
│  └── lib/ai/retry.ts (Exponential backoff)                      │
│  └── lib/ai/registry/validation.ts (Input sanitization)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Providers

### OpenRouter (Cloud)

Access to multiple LLM models via API.

**Configuration:**
```bash
OPENROUTER_API_KEY=sk-...
```

**Available Models:**
- `meta-llama/llama-3.3-70b-instruct:free` - Most capable
- `google/gemini-2.0-flash-exp:free` - Fast
- `deepseek/deepseek-r1:free` - Reasoning focused
- `mistralai/mistral-7b-instruct:free` - Lightweight

### Ollama (Local)

Run LLMs on your own hardware.

**Installation:**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start service
ollama serve

# Pull models
ollama pull llama3.2
ollama pull mistral
ollama pull deepseek-r1
```

**Configuration:**
```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### Auto Mode (Recommended)

Tries local Ollama first, falls back to OpenRouter.

```bash
AI_PROVIDER=auto
AI_PREFER_LOCAL=true
OPENROUTER_API_KEY=sk-...  # Fallback
```

---

## 🤖 Registered Agents

### 1. Email Draft Generator
- **ID**: `email-draft-generator`
- **Purpose**: Professional email drafts for student communications
- **Templates**: lesson_reminder, progress_report, payment_reminder, milestone_celebration

### 2. Lesson Notes Assistant
- **ID**: `lesson-notes-assistant`
- **Purpose**: Structured lesson documentation
- **Output**: Notes with practice recommendations

### 3. Assignment Generator
- **ID**: `assignment-generator`
- **Purpose**: Personalized practice assignments
- **Context**: Student level, songs, techniques

### 4. Post-Lesson Summary
- **ID**: `post-lesson-summary`
- **Purpose**: Student-friendly lesson summaries
- **Output**: Summary for students/parents

### 5. Student Progress Insights
- **ID**: `student-progress-insights`
- **Purpose**: Learning pattern analysis
- **Output**: Actionable recommendations

### 6. Admin Dashboard Insights
- **ID**: `admin-dashboard-insights`
- **Purpose**: Business intelligence
- **Access**: Admin only

---

## 💻 Usage

### Server Actions

```typescript
import { generateAIResponse, getAvailableModels } from '@/app/actions/ai';

// Generate response
const result = await generateAIResponse(
  'How can I improve student retention?',
  'llama3.2'
);

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.content);
}

// Get available models
const { models, providerName } = await getAvailableModels();
```

### Agent Execution

```typescript
import { executeAgent } from '@/lib/ai/agent-execution';

const response = await executeAgent('email-draft-generator', {
  template_type: 'lesson_reminder',
  student_name: 'John Doe',
  lesson_date: '2026-01-15',
  lesson_time: '3:00 PM',
});
```

### Specialized Functions

```typescript
import {
  generateEmailDraftAgent,
  generateLessonNotesAgent,
  analyzeStudentProgressAgent
} from '@/lib/ai/agent-execution';

// Type-safe email generation
const emailResponse = await generateEmailDraftAgent({
  template_type: 'progress_report',
  student_name: 'Jane Smith',
  student_id: 'student-123',
});

// Lesson notes
const notesResponse = await generateLessonNotesAgent({
  student_name: 'Jane Smith',
  lesson_topic: 'Chord Transitions',
  songs_covered: 'Wonderwall, House of the Rising Sun',
});
```

---

## 📍 UI Integration Points

### Standalone Pages

| Path | Component | Purpose |
|------|-----------|---------|
| `/ai` | AIAssistantCard | Development/testing |
| `/dashboard/ai` | AIAssistantCard | Admin AI playground |

### Embedded Components

| Location | Component | Purpose |
|----------|-----------|---------|
| Lesson Form | LessonNotesAI | Generate lesson notes |
| Assignment Form | AssignmentAI | Generate assignments |
| Teacher Dashboard | EmailDraftGenerator | Draft emails |
| Teacher Dashboard | AdminDashboardInsights | Business insights |
| Teacher Dashboard | StudentProgressInsights | Progress analysis |

---

## 🔒 Security

### Rate Limiting

Role-based request limits:

| Role | Limit |
|------|-------|
| Admin | 100/minute |
| Teacher | 50/minute |
| Student | 20/minute |
| Anonymous | 5/minute |

### Input Sanitization

Automatic protection against:
- Prompt injection attacks
- Role marker manipulation
- Code block injection
- Sensitive data exposure

### Sensitive Data Handling

Agents can specify handling mode:
- `'block'` - Reject if sensitive data detected
- `'sanitize'` - Mask sensitive data (emails, credit cards)
- `'allow'` - Pass through (use carefully)

---

## ⚙️ Configuration

### Environment Variables

```bash
# Provider Selection
AI_PROVIDER=auto           # auto | openrouter | ollama
AI_PREFER_LOCAL=true       # Try Ollama first

# OpenRouter
OPENROUTER_API_KEY=sk-...

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

### Model Mappings

Automatic translation between providers:

| OpenRouter Model | Ollama Equivalent |
|------------------|-------------------|
| meta-llama/llama-3.3-70b-instruct:free | llama3.2 |
| deepseek/deepseek-r1:free | deepseek-r1 |
| mistralai/mistral-7b-instruct:free | mistral |

---

## 🔧 Troubleshooting

### "Ollama is not available"

```bash
# Check if Ollama is running
ollama serve

# Verify models
ollama list
```

### "No models found"

```bash
# Pull at least one model
ollama pull llama3.2
```

### Rate Limit Exceeded

```typescript
{
  error: 'Rate limit exceeded',
  retryAfter: 45  // seconds
}
```

Wait for the specified time or switch to a less rate-limited role.

### Provider Not Responding

The system will automatically:
1. Retry with exponential backoff (3 attempts)
2. Fall back to alternate provider (in auto mode)
3. Return error with details

---

## 📚 API Reference

### generateAIResponse

```typescript
function generateAIResponse(
  prompt: string,
  model?: string
): Promise<{ content?: string; error?: string }>
```

### getAvailableModels

```typescript
function getAvailableModels(): Promise<{
  models: AIModelInfo[];
  providerName: string;
}>
```

### executeAgent

```typescript
function executeAgent(
  agentId: string,
  context: Record<string, unknown>,
  metadata?: {
    userId?: string;
    userRole?: string;
    entityId?: string;
    entityType?: string;
  }
): Promise<{ success: boolean; result?: string; error?: string }>
```

---

## 🗺️ Roadmap

### Planned Features

| Feature | Status | Description |
|---------|--------|-------------|
| RAG Documentation | ❌ Planned | Query docs for CRM answers |
| Student AI Assistant | ❌ Planned | Restricted agent for students |
| Audio Analysis | ❌ Long-term | Analyze student practice recordings |
| Action Execution | ❌ Long-term | AI triggers CRM actions |
