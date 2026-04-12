# Superpowers Skills for Qwen Code

This directory contains 14 Superpowers skills installed for Qwen Code.

## Installed Skills

| # | Skill | Description |
|---|-------|-------------|
| 1 | **brainstorming** | Explore user intent, requirements and design BEFORE implementation |
| 2 | **dispatching-parallel-agents** | Run 2+ independent tasks in parallel without shared state |
| 3 | **executing-plans** | Execute written implementation plans with review checkpoints |
| 4 | **finishing-a-development-branch** | Complete development: verify tests, present merge/PR options |
| 5 | **receiving-code-review** | Receive and apply code review feedback with verification |
| 6 | **requesting-code-review** | Dispatch code reviewer subagent with proper context |
| 7 | **subagent-driven-development** | Execute plans by dispatching fresh subagent per task with two-stage review |
| 8 | **systematic-debugging** | Root cause analysis BEFORE any bug fix (4-phase process) |
| 9 | **test-driven-development** | TDD cycle: RED → GREEN → REFACTOR with verification at each step |
| 10 | **using-git-worktrees** | Isolated workspace for feature development |
| 11 | **using-superpowers** | Master guide on how to use all skills effectively |
| 12 | **verification-before-completion** | Run verification BEFORE any success claim |
| 13 | **writing-plans** | Create comprehensive implementation plans with bite-sized tasks |
| 14 | **writing-skills** | Create and test new skills using TDD methodology |

## How Skills Work

Each skill directory contains:
- `SKILL.md` — Main skill documentation with methodology
- Additional files — Prompt templates, reference docs, scripts (as needed)

### Invocation

Skills are invoked using the `skill` tool in Qwen Code:

```
skill: "brainstorming"
```

**Critical:** The skill tool MUST be called as the FIRST action when a task matches a skill's description.

## Skill Categories

### Planning
- `brainstorming` — Design exploration
- `writing-plans` — Implementation planning

### Development
- `subagent-driven-development` — Primary execution method (recommended)
- `executing-plans` — Alternative for parallel sessions
- `test-driven-development` — TDD for all code changes
- `dispatching-parallel-agents` — Parallel independent tasks

### Quality
- `systematic-debugging` — Debug any issues systematically
- `verification-before-completion` — Verify before claiming success
- `requesting-code-review` — Code review before merge
- `receiving-code-review` — Apply review feedback

### Workflow
- `using-git-worktrees` — Isolated workspaces
- `finishing-a-development-branch` — Complete and integrate work

## Typical Workflow

```
brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch
      ↓              ↓                    ↓                          ↓
   Design         Plan               Execute with                Merge/PR
                                      TDD + Review
```

At each step, the corresponding skill is invoked and followed its methodology exactly.

## Additional Resources

- [Superpowers GitHub](https://github.com/obra/superpowers)
- [Project Setup Guide](../.agents/SETUP.md)
- [Project AGENTS.md](../AGENTS.md)
