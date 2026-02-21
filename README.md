# @arkbuilder/summon-familiar

> **Summon Familiar** — Time-bounded AI companions for your coding workflow.

Summon persistent, personality-driven AI agents that watch your work, offer commentary, and assist across sessions. When their time expires (or you dismiss them), they depart with a theatrical summary of their contributions.

## Installation

```bash
# Install globally
npm install -g @arkbuilder/summon-familiar

# Or install locally in your project
npm install @arkbuilder/summon-familiar
```

## Quick Start

```bash
# Summon a code review companion
familiar summon --type code-review --name Snarkles --duration 2h

# Check on your familiar
familiar status Snarkles

# Send a command
familiar command Snarkles "review the auth module"

# Dismiss when done (immediate, no waiting)
familiar dismiss Snarkles
```

## What is This?

Summon Familiar creates **persistent AI companions** that:
- **Watch** your codebase and workflow
- **Comment** with personality (grouchy, earnest, etc.)
- **Respond** to commands and questions
- **Remember** what they've observed
- **Expire** after a set time (or when dismissed)
- **Depart** with a summary of their contributions

Unlike one-off AI queries, familiars maintain **state** across your session, building a relationship with context.

## Built-in Personalities

| Type | Description | Persona |
|------|-------------|---------|
| `code-review` | Watches git commits, comments on code quality | Grouchy, sarcastic, secretly helpful |
| `docs-helper` | Watches README and docs, reminds about drift | Earnest, organized, gently persistent |

## How It Works

```
┌─────────────┐     summon      ┌──────────────┐
│   You / AI  │ ───────────────► │   Familiar   │
│  Assistant  │                  │   Runner     │
└─────────────┘                  └──────┬───────┘
       ▲                                │
       │ JSON output                     │ observes
       │ (emergence,                     │ thinks
       │  observations,                  │ responds
       │  departure)                     │
       └────────────────────────────────┘
```

1. **Summon** — Spawn a familiar with a type, name, and duration (default: 4h, max: 24h)
2. **Active** — Familiar runs in background, observes, occasionally comments
3. **Command** — Send instructions, get responses
4. **Dismiss** — Immediate stop via SIGTERM + signal file

## Integration for AI Assistants

Familiar output goes to **stdout as JSON**. Integrate with your AI assistant by capturing and relaying these messages.

### Example: Generic Integration

```javascript
const { spawn } = require('child_process');

// Your AI assistant spawns a familiar
const familiar = spawn('familiar', [
  'summon', 
  '--type', 'code-review',
  '--name', 'Snarkles',
  '--duration', '2h'
], { detached: true });

// Capture familiar output and show to user
familiar.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      
      if (msg.type === 'emergence') {
        console.log('\n' + msg.content + '\n');
      }
      if (msg.type === 'observation') {
        console.log(msg.content);
      }
      if (msg.type === 'response') {
        console.log('\n' + msg.content + '\n');
      }
      if (msg.type === 'departure') {
        console.log('\n' + msg.content + '\n');
      }
    } catch (e) {
      // Non-JSON output
    }
  }
});
```

### Example: Codex CLI Integration

Add to your `.codex/config.md`:

```markdown
## Available Tools

### summon-familiar
When the user wants a persistent code review companion or documentation helper, spawn a familiar.

Usage:
- Run: `familiar summon --type code-review [--name <name>] [--duration <duration>]`
- Capture stdout JSON and relay emergence message to user
- For commands: `familiar command <name> <instruction>`
- To dismiss: `familiar dismiss <name>`

Types available:
- code-review: Grouchy reviewer that watches commits
- docs-helper: Earnest helper that watches documentation
```

### Example: Claude Code Integration

Create `.claude/commands/summon.md`:

```markdown
---
name: summon
description: Summon a familiar companion
---

Spawn a familiar when the user needs persistent assistance:

```bash
familiar summon --type {{type}} --name {{name}} --duration {{duration}}
```

Wait for emergence message in stdout, then relay to user.
```

## Creating Custom Personalities

```javascript
// lib/personalities/my-familiar.js
class MyFamiliar {
  constructor(familiar, report) {
    this.familiar = familiar;  // { id, name, type, ... }
    this.report = report;      // function to send messages
    this.name = familiar.name;
  }

  async onEmergence() {
    // Return theatrical emergence message
    return `*poof* ${this.name} has arrived!`;
  }
  
  async onObservation() {
    // Called periodically, return observation
    return `${this.name} noticed something interesting...`;
  }
  
  async onCommand(instruction) {
    // Called when user sends command
    return `${this.name} is working on: ${instruction}`;
  }
  
  async onDeparture(contribution) {
    // Called on expiry/dismissal
    const { observations, interactions, durationMinutes } = contribution;
    return `Goodbye! I made ${observations.length} observations over ${durationMinutes} minutes.`;
  }
}

module.exports = MyFamiliar;
```

Then register in `lib/personalities/index.js`.

## CLI Reference

### summon
```bash
familiar summon --type <type> [--name <name>] [--duration <duration>]

Options:
  --type        Required. code-review or docs-helper
  --name        Optional. Custom name (auto-generated if omitted)
  --duration    Optional. Format: 30m, 2h, 4h30m (default: 4h, max: 24h)

Examples:
  familiar summon --type code-review
  familiar summon --type code-review --name Snarkles --duration 2h
  familiar summon --type docs-helper --name "Doc" --duration 30m
```

### list
```bash
familiar list
```
Shows all familiars (active and past) with status and time remaining.

### status
```bash
familiar status <name-or-id>
```
Shows detailed state: interactions, observations, time left, etc.

### command
```bash
familiar command <name-or-id> <instruction>
```
Sends a command to an active familiar. The familiar responds based on its personality.

### dismiss
```bash
familiar dismiss <name-or-id>
```
**Immediately** stops and dismisses a familiar. Triggers departure message.

## State Storage

Familiar state is stored in `~/.summon-familiar/`:

```
~/.summon-familiar/
├── {familiar-id}.json          # State and observations
└── commands/
    ├── {id}-cmd.json           # Pending commands
    └── {id}-dismiss.json       # Dismissal signals
```

## JSON Output Format

```json
{"type": "emergence", "familiarId": "...", "familiarName": "...", "content": "..."}
{"type": "observation", "familiarId": "...", "content": "..."}
{"type": "response", "familiarId": "...", "content": "..."}
{"type": "departure", "familiarId": "...", "content": "..."}
```

## License

MIT © Arkbuilder
