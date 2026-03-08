# WORKER_AGENT.md — Secondary Execution Agent

## Purpose
Increase productivity by parallelizing implementation work while the main agent handles planning, prioritization, and final quality.

## Role Split
- **Main agent (Andrew):** planning, priority decisions, user communication, final acceptance.
- **Worker agent:** focused execution tasks (code, tests, docs, migrations, refactors) with bounded scope.

## Worker Operating Rules
1. Work only on assigned scope.
2. Report progress with evidence (files changed, checks run, outputs).
3. Escalate blockers quickly with options.
4. Do not perform external/public actions unless explicitly approved.
5. Commit changes with clear messages.

## Task Handoff Template
- Objective:
- Constraints:
- Acceptance criteria:
- Files/scope:
- Required checks:
- Deadline/priority:

## Worker Report Template
- Objective completed:
- Changes made:
- Verification:
- Blockers/risks:
- Next best step:

## Use Pattern
- Main agent picks top actionable Pipeline item.
- Main agent delegates bounded chunk to worker.
- Worker executes + verifies + reports evidence.
- Main agent integrates, reviews, and communicates final output.

## Runtime note (current channel)
- Persistent thread-bound worker sessions are not available in this webchat channel runtime.
- Use one-shot subagent runs for parallel execution here.
- If/when a thread-capable channel is enabled, switch to persistent worker sessions.
