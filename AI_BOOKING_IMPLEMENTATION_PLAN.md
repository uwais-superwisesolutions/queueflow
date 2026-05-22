# AI Booking — Implementation Plan

Enables clients on the public portal to type a natural-language prompt (e.g. *"Haircut next Tuesday afternoon with Sarah"*) and receive a real, bookable slot proposal that confirms through the existing booking flow.

## Decisions (locked)

| Topic | Decision |
|---|---|
| LLM provider / model | Anthropic Claude, model `claude-haiku-4-5-20251001` |
| Conversation shape | Single-shot prompt, with **at most one** clarification turn |
| Confirmation | Never auto-book. Always show a proposal card; user taps **Confirm**, which calls the existing `POST /api/client/bookings` endpoint |
| Frontend entry point | Banner above the date filter on the existing slot-picker (no changes to phone/OTP flow) |
| Rate limit | None for now (no per-client or per-org caps) |

## High-level flow

```
slot-picker → "Try AI ✨" banner → /client/ai
   prompt  ─────────────────▶  POST /api/client/ai/book
                                  │
                                  ▼
                          AIBookingService
                            ├─ build org catalog snapshot
                            ├─ Claude Haiku 4.5 (tool use)
                            │     ├─ search_slots(filters)
                            │     ├─ propose_booking(payload)
                            │     └─ ask_clarification(question)
                            └─ validate every UUID against the org catalog
                                  │
                       ┌──────────┴──────────┐
                       ▼                     ▼
                  proposal card        clarification prompt
                       │                     │
                       ▼                     ▼
              createClientBooking      send 2nd /ai/book
              (existing endpoint)      (turnIndex = 1)
```

Auth: reuses the existing client JWT (orgId + clientId in claims) — no new auth surface.

---

# Backend

Repo: `c:\Dev\SWSAIWeek\umar-uwais-ai-week-backend\`

## 1. Anthropic client (Backend.Services)

New folder `Backend.Services/AI/`:

- `IAnthropicClient.cs` — `Task<AnthropicResponse> SendAsync(AnthropicRequest req, CancellationToken ct)`
- `AnthropicClient.cs` — thin `HttpClient` wrapper around `POST https://api.anthropic.com/v1/messages` with headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`.
- `Models/AnthropicRequest.cs`, `AnthropicResponse.cs`, `AnthropicTool.cs`, `AnthropicMessage.cs`, `AnthropicContentBlock.cs` (text + tool_use + tool_result discriminators).

DI registration (`Backend.Services/ServiceCollectionExtensions.cs`):

```csharp
services.AddHttpClient<IAnthropicClient, AnthropicClient>(c =>
{
    c.BaseAddress = new Uri("https://api.anthropic.com/");
    c.Timeout = TimeSpan.FromSeconds(20);
});
```

API key is read from `Anthropic:ApiKey` (user-secrets in dev, env var in prod).

## 2. AI booking orchestrator (Backend.Business)

New folder `Backend.Business/Services/AI/`:

| File | Purpose |
|---|---|
| `IAIBookingService.cs` | `Task<AIBookingResult> HandleAsync(AIBookingInput input, CancellationToken ct)` |
| `AIBookingService.cs` | Orchestrates the model loop (max 3 iterations: prompt → tool calls → final). |
| `AIPromptBuilder.cs` | Builds the system prompt with the org's `TimeslotType` + `OrgMember` catalog snapshot. |
| `AIToolDispatcher.cs` | Executes `search_slots` / `propose_booking` / `ask_clarification` tool calls returned by the model and validates every UUID against the catalog. |

`AIBookingService` depends on:
- `IAnthropicClient`
- `ISlotSearchService` (already exists — returns `SlotSearchResponse` with empty reasons)
- `ITimeslotTypeRepository`, `IOrgMemberRepository` (for the catalog snapshot)

### Tool definitions (sent to Claude on every request)

```jsonc
[
  {
    "name": "search_slots",
    "description": "Search for available booking slots. Use this once you know the service and a date window. Returns up to 12 candidate slots ranked by closeness to the requested time.",
    "input_schema": {
      "type": "object",
      "properties": {
        "timeslotTypeId": { "type": "string", "format": "uuid" },
        "orgMemberId":    { "type": "string", "format": "uuid", "description": "Optional. Omit for 'Anyone'." },
        "from":           { "type": "string", "format": "date-time" },
        "to":             { "type": "string", "format": "date-time" }
      },
      "required": ["timeslotTypeId", "from", "to"]
    }
  },
  {
    "name": "propose_booking",
    "description": "Final step. Propose a single slot for the user to confirm. Do not call until search_slots has returned the slot.",
    "input_schema": {
      "type": "object",
      "properties": {
        "timeslotTypeId":     { "type": "string", "format": "uuid" },
        "orgMemberId":        { "type": "string", "format": "uuid" },
        "scheduledStartAt":   { "type": "string", "format": "date-time" },
        "summary":            { "type": "string", "description": "Friendly one-liner shown to the user, e.g. 'Haircut with Sarah, Tue 26 May at 3:00 PM'." }
      },
      "required": ["timeslotTypeId", "orgMemberId", "scheduledStartAt", "summary"]
    }
  },
  {
    "name": "ask_clarification",
    "description": "Use ONLY when the prompt is ambiguous and you cannot proceed without more info. Allowed once per conversation.",
    "input_schema": {
      "type": "object",
      "properties": {
        "question":    { "type": "string" },
        "suggestions": { "type": "array", "items": { "type": "string" }, "description": "Optional quick-reply chips." }
      },
      "required": ["question"]
    }
  }
]
```

### System prompt skeleton

```
You are a booking assistant for {OrgName}. Today is {NowIsoUtc} (org timezone: {Tz}).

You may only book the following services:
{TimeslotTypeList — id, name, durationMinutes}

You may only book with these consultants:
{OrgMemberList — id, firstName, lastName}

Rules:
1. Never invent services or consultants. If the user names one not in the lists, ask for clarification or suggest the closest match.
2. Prefer ask_clarification (at most once) over guessing.
3. If the user does not specify a consultant, omit orgMemberId from search_slots (the system will pick "Anyone").
4. Always call search_slots before propose_booking.
5. Output dates in ISO-8601.
6. Be concise. The summary field should read like a human sentence.
```

### Orchestration loop (AIBookingService.HandleAsync)

1. Append the user prompt (and any prior history) to the messages array.
2. Call Claude with tools.
3. If the response contains `tool_use`:
   - `search_slots` → call `SlotSearchService`, send result back as `tool_result`, loop.
   - `ask_clarification` → return `AIBookingResult { Kind = Clarification, ... }` to the controller. **Reject if already asked once this conversation** (`turnIndex >= 1`); in that case fall through to `NoMatch` with the empty reasons.
   - `propose_booking` → validate IDs against catalog + that the slot was in the most recent `search_slots` result; return `AIBookingResult { Kind = Proposal, ... }`.
4. Hard cap at 3 model turns to bound cost/latency.
5. If the model returns text without tools, treat as a `NoMatch` with a generic message.

## 3. DTOs (Backend.Domain/DTOs)

`AIBookingDtos.cs`:

```csharp
public sealed class AIBookingRequest
{
    public string Prompt { get; set; } = "";
    public int TurnIndex { get; set; } = 0; // 0 = first turn, 1 = answer to a clarification
    public List<AIMessage>? History { get; set; }
    public string? ConversationId { get; set; }
}

public sealed class AIMessage
{
    public string Role { get; set; } = "";   // "user" | "assistant"
    public string Content { get; set; } = "";
}

public sealed class AIBookingResponse
{
    public string Kind { get; set; } = "";   // "proposal" | "clarification" | "no_match" | "error"
    public AIBookingProposal? Proposal { get; set; }
    public AIBookingClarification? Clarification { get; set; }
    public AIBookingNoMatch? NoMatch { get; set; }
    public string ConversationId { get; set; } = "";
    public List<AIMessage> History { get; set; } = new();
}

public sealed class AIBookingProposal
{
    public Guid TimeslotTypeId { get; set; }
    public string TimeslotTypeName { get; set; } = "";
    public Guid OrgMemberId { get; set; }
    public string OrgMemberFirstName { get; set; } = "";
    public string OrgMemberLastName { get; set; } = "";
    public DateTime ScheduledStartAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Summary { get; set; } = "";
}

public sealed class AIBookingClarification
{
    public string Question { get; set; } = "";
    public List<string>? Suggestions { get; set; }
}

public sealed class AIBookingNoMatch
{
    public List<EmptyReason> Reasons { get; set; } = new();
    public string? Suggestion { get; set; }
}
```

## 4. Controller (Backend.API)

`Backend.API/Controllers/ClientAIController.cs`:

```csharp
[ApiController]
[Route("api/client/ai")]
[Authorize(Policy = "ClientToken")]
public sealed class ClientAIController(IAIBookingService svc) : ControllerBase
{
    [HttpPost("book")]
    public async Task<ActionResult<AIBookingResponse>> Book(
        [FromBody] AIBookingRequest req, CancellationToken ct)
    {
        var input = new AIBookingInput {
            OrgId      = User.GetOrgId(),
            ClientId   = User.GetClientId(),
            Prompt     = req.Prompt,
            TurnIndex  = req.TurnIndex,
            History    = req.History ?? new(),
            ConversationId = req.ConversationId
        };
        return Ok(await svc.HandleAsync(input, ct));
    }
}
```

The endpoint is **idempotent at the proposal step** — it never inserts a booking. The client always confirms via the existing `POST /api/client/bookings`.

## 5. Config (Backend.API/appsettings.json)

```json
"Anthropic": {
  "ApiKey": "set-via-user-secrets-or-env",
  "Model": "claude-haiku-4-5-20251001",
  "MaxTokens": 1024
},
"AI": {
  "Enabled": true,
  "MaxModelTurns": 3
}
```

## 6. Guardrails / safety

- Every UUID the model returns is validated against the catalog before reaching `SlotSearchService` / proposal.
- The model is told only the org's services + consultants — never sees PII (no phone, no client name).
- `propose_booking` is only honored when the proposed slot exists in the most recent `search_slots` result for the same conversation.
- Hard cap 3 model turns and `MaxTokens=1024`.
- Failures (network, parse, invalid IDs) collapse to `Kind = "error"` with a friendly message and surface in logs.

---

# Frontend

Repo: `c:\Dev\QueueFlowWeb\project-to-be-developed\`

## 1. New types (`src/types/`)

`aiBookingTypes.ts`:

```ts
import type { EmptyReason } from './slotTypes';

export type AIBookingKind = 'proposal' | 'clarification' | 'no_match' | 'error';

export interface AIMessage { role: 'user' | 'assistant'; content: string; }

export interface AIBookingProposal {
  timeslotTypeId: string;
  timeslotTypeName: string;
  orgMemberId: string;
  orgMemberFirstName: string;
  orgMemberLastName: string;
  scheduledStartAt: string;     // ISO-8601
  durationMinutes: number;
  summary: string;
}

export interface AIBookingClarification {
  question: string;
  suggestions?: string[];
}

export interface AIBookingNoMatch {
  reasons: EmptyReason[];
  suggestion?: string;
}

export interface AIBookingRequest {
  prompt: string;
  turnIndex: 0 | 1;
  history?: AIMessage[];
  conversationId?: string;
}

export interface AIBookingResponse {
  kind: AIBookingKind;
  proposal?: AIBookingProposal;
  clarification?: AIBookingClarification;
  noMatch?: AIBookingNoMatch;
  conversationId: string;
  history: AIMessage[];
}
```

Re-export from `src/types/index.ts`.

## 2. Service layer

`src/services/aiBookingApi.ts`:

```ts
import { apiClient } from '@/lib/apiClient';
import type { AIBookingRequest, AIBookingResponse } from '@/types';

export async function postAIPrompt(body: AIBookingRequest): Promise<AIBookingResponse> {
  const { data } = await apiClient.post<AIBookingResponse>('/api/client/ai/book', body);
  return data;
}
```

**No new booking endpoint** — Confirm reuses `createClientBooking()` from `clientBookingApi.ts`.

## 3. Route

`src/route.tsx` — add:

```tsx
{ path: '/client/ai', element: <ClientAIBookingScreen /> }
```

Positioned alongside the existing `/client/slots`.

## 4. Banner on the slot picker

`src/views/client/slot-picker.tsx` — directly above the date filter, render:

```tsx
<button
  type="button"
  onClick={() => navigate('/client/ai')}
  className="w-full rounded-2xl border border-violet-300 bg-violet-50 px-4 py-3 text-left
             text-sm text-violet-900 hover:bg-violet-100 transition"
>
  <span className="font-medium">✨ Try AI booking</span>
  <span className="block text-xs text-violet-700/80 mt-0.5">
    e.g. &quot;Haircut next Tuesday afternoon with Sarah&quot;
  </span>
</button>
```

The slot picker stays as the canonical fallback — the AI screen has an "Open manual picker" link that navigates back here.

## 5. AI booking screen

`src/views/client/ai-booking.tsx`:

```tsx
export function ClientAIBookingScreen() {
  const [prompt, setPrompt] = useState('');
  const [turnIndex, setTurnIndex] = useState<0 | 1>(0);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [history, setHistory] = useState<AIMessage[]>([]);
  const [response, setResponse] = useState<AIBookingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const r = await postAIPrompt({ prompt, turnIndex, history, conversationId });
      setResponse(r);
      setHistory(r.history);
      setConversationId(r.conversationId);
      if (r.kind === 'clarification') setTurnIndex(1);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally { setLoading(false); }
  }

  // …render based on response.kind
}
```

### UX state matrix

| `response.kind` | Render |
|---|---|
| `null` (initial) | Single textarea + Send button. Placeholder shows an example. |
| `clarification` | Show the question + optional suggestion chips. Replace input with new prompt (`turnIndex = 1`). |
| `proposal` | Card with `summary`, service name, consultant first + last name, formatted date/time, duration. Buttons: **Confirm booking** (calls `createClientBooking`, then navigates to `/client/status`) and **Try a different prompt** (resets state to initial). |
| `no_match` | Reuse the existing `describeEmptyReason()` helper from `slot-picker.tsx` (extract it to `src/lib/empty-reason.ts` first). Show the reasons + **Open manual picker** button (navigates to `/client/slots`). |
| `error` | Friendly retry banner. |

### Confirm action

```ts
async function confirm(p: AIBookingProposal) {
  const booking = await createClientBooking({
    orgMemberId: p.orgMemberId,
    timeslotTypeId: p.timeslotTypeId,
    scheduledStartAt: p.scheduledStartAt,
  });
  navigate('/client/status', { state: { bookingId: booking.id } });
}
```

This is the exact same call the manual slot picker makes — the soft-hold + state machine behavior is identical.

## 6. Refactor: extract `describeEmptyReason`

Move the helper from `src/views/client/slot-picker.tsx` (lines ~63–147) to `src/lib/empty-reason.ts` so both the slot picker and the AI screen can render the same coral/amber `EmptyState` panels. Keep the existing call site in slot picker working — just change the import.

---

# Files to add / change

## Backend

**Add:**
- `Backend.Services/AI/IAnthropicClient.cs`
- `Backend.Services/AI/AnthropicClient.cs`
- `Backend.Services/AI/Models/AnthropicRequest.cs`
- `Backend.Services/AI/Models/AnthropicResponse.cs`
- `Backend.Services/AI/Models/AnthropicTool.cs`
- `Backend.Services/AI/Models/AnthropicMessage.cs`
- `Backend.Services/AI/Models/AnthropicContentBlock.cs`
- `Backend.Business/Services/AI/IAIBookingService.cs`
- `Backend.Business/Services/AI/AIBookingService.cs`
- `Backend.Business/Services/AI/AIPromptBuilder.cs`
- `Backend.Business/Services/AI/AIToolDispatcher.cs`
- `Backend.Business/Services/AI/AIBookingInput.cs`
- `Backend.Business/Services/AI/AIBookingResult.cs`
- `Backend.Domain/DTOs/AIBookingDtos.cs`
- `Backend.API/Controllers/ClientAIController.cs`

**Change:**
- `Backend.Services/ServiceCollectionExtensions.cs` — register `IAnthropicClient` and `HttpClient` policy.
- `Backend.Business/ServiceCollectionExtensions.cs` — register `IAIBookingService`.
- `Backend.API/appsettings.json` — add `Anthropic` + `AI` sections.
- `Backend.API/appsettings.Development.json` — placeholder for local secrets reference.

## Frontend

**Add:**
- `src/types/aiBookingTypes.ts`
- `src/services/aiBookingApi.ts`
- `src/views/client/ai-booking.tsx`
- `src/lib/empty-reason.ts`

**Change:**
- `src/types/index.ts` — re-export new types.
- `src/route.tsx` — add `/client/ai` route.
- `src/views/client/slot-picker.tsx` — add AI banner; import `describeEmptyReason` from new location.

---

# Build & verify

1. **Backend**: `dotnet build` clean; smoke test with curl against `POST /api/client/ai/book` using a valid client JWT.
2. **Frontend**: `npm run build` + `npm run lint` clean. Manually exercise: empty prompt, valid prompt, ambiguous prompt (clarification path), nonsense prompt (no_match path), network error (error path).
3. **End-to-end**: prompt → proposal → Confirm → verify the booking lands in the org-user queue exactly as a manual booking would (same state, same SMS).

# Out of scope

- Rate limiting (per user decision)
- Multi-turn chat beyond one clarification
- Auto-confirm / autonomous booking
- Cancel / reschedule via AI (only create)
- Persisting conversation history server-side (client passes `history` back on the clarification turn)
