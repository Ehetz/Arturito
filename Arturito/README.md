# Arturito — Multi-Agent System Template

A plug-and-play multi-agent setup for OpenClaw. One orchestrator, three specialists.

## Agents

| Agent | Role | openclaw ID |
|---|---|---|
| **Arturito** | Orchestrator | `arturito` |
| **Archi** | Registry, storage, databases, APIs | `archi` |
| **Dash** | Dashboards and data visualization | `dash` |
| **Bob** | Developer — scripts, APIs, integrations | `bob` |

---

## How to Deploy to a New Project

### Step 1 — Register agents in OpenClaw

Run once per agent:

```bash
openclaw agents add arturito
openclaw agents add archi
openclaw agents add dash
openclaw agents add bob
```

This creates each agent's workspace and registers them in `openclaw.json`.

### Step 2 — Copy files to each agent's workspace

```bash
# Replace /path/to/openclaw with your actual openclaw root
OPENCLAW=~/.openclaw

cp -r Arturito/*  $OPENCLAW/workspace/arturito/
cp -r Archi/*     $OPENCLAW/workspace/archi/
cp -r Dash/*      $OPENCLAW/workspace/dash/
cp -r Bob/*       $OPENCLAW/workspace/bob/
```

### Step 3 — Fill in the blanks (per project)

In each agent's workspace, update:

| File | What to fill in |
|---|---|
| `USER.md` | Client name, timezone, preferences, context |
| `IDENTITY.md` | Agent name, vibe, emoji (optional customization) |
| `TOOLS.md` | Environment-specific notes (SSH hosts, DB names, API endpoints) |

### Step 4 — Verify openclaw.json

Confirm each agent has the correct `workspace` and `agentDir` paths:

```json
{
  "agents": {
    "list": [
      { "id": "arturito", "name": "Arturito", "workspace": "/path/to/workspace/arturito", "agentDir": "/path/to/agents/arturito/agent" },
      { "id": "archi",    "name": "Archi",    "workspace": "/path/to/workspace/archi",    "agentDir": "/path/to/agents/archi/agent" },
      { "id": "dash",     "name": "Dash",     "workspace": "/path/to/workspace/dash",     "agentDir": "/path/to/agents/dash/agent" },
      { "id": "bob",      "name": "Bob",      "workspace": "/path/to/workspace/bob",      "agentDir": "/path/to/agents/bob/agent" }
    ]
  }
}
```

---

## How the System Works

```
User
 └─ Arturito (orchestrator)
       ├─ sessions_spawn → Archi  (before every task: where is data? where to store?)
       ├─ sessions_spawn → Dash   (build dashboards)
       ├─ sessions_spawn → Bob    (build code/scripts)
       └─ sessions_spawn → Archi  (after every task: register the output)
```

**Key constraints:**
- Only Arturito can spawn sub-agents (`maxSpawnDepth: 1`)
- Sub-agents cannot talk to each other directly — everything routes through Arturito
- Sub-agents are stateless — each spawn starts fresh, no memory of prior runs
- A sub-agent's last message = its result (announce flow)

---

## Adding a New Agent

1. Create a new folder here (e.g., `Nova/`)
2. Add `AGENTS.md` (copy from any existing sub-agent, update agent name)
3. Add `SOUL.md` (define the agent's domain and methodology)
4. Add `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `TOOLS.md` (copy templates)
5. Run `openclaw agents add nova`
6. Copy files to the new workspace
7. Add Nova to the roster in Arturito's `AGENTS.md`
