---
name: skill-generation
description: >-
  Create or update repository-local agent skills so they work across GitHub
  Copilot, Codex, and Claude Code from the shared .agents source of truth. Use
  when adding a new skill, moving agent-specific instructions into .agents,
  wiring Claude compatibility through symlinks, or making skills/hooks/context
  agent-agnostic across these tools.
---

# Skill Generation

Create skills and supporting agent files with `.agents` as the single source of
truth. Keep outputs tool-agnostic: do not create tool-specific skill copies,
tool-specific metadata, or product-specific UI files.

## Source Of Truth

- Put skills in `.agents/skills/<skill-name>/SKILL.md`.
- Put reusable hook/helper scripts in `.agents/scripts/`.
- Put shared repository context in `AGENTS.md`.
- Keep `CLAUDE.md` as a thin import wrapper around `AGENTS.md`.
- Keep `.claude/skills` as a symlink to `../.agents/skills`.
- Do not add `agents/openai.yaml`, `.codex/skills`, `.github/skills`, or
  duplicated `.claude/skills/<skill-name>` directories.

## Create Or Update A Skill

1. Choose a lowercase hyphenated name.
2. Create or edit `.agents/skills/<skill-name>/SKILL.md`.
3. Use only `name` and `description` in YAML frontmatter unless an existing repo
   convention says otherwise.
4. Put all trigger conditions in `description`; the body loads only after the
   skill triggers.
5. Keep the body concise and procedural.
6. Add scripts only when deterministic, repeatable behavior is useful; place
   them in `.agents/scripts/`, not inside the skill folder.
7. Reference shared scripts from the skill by their `.agents/scripts/...` path.
8. Delete generated or accidental tool-specific metadata such as
   `agents/openai.yaml`.
9. If a scaffold command creates `agents/openai.yaml`, remove it before
   finishing; this repository intentionally does not keep OpenAI/Codex-specific
   skill metadata.

## Claude Compatibility

Verify Claude sees the shared content through symlinks and imports:

```bash
readlink .claude/skills
find -L .claude/skills -maxdepth 2 -type f | sort
sed -n '1,20p' CLAUDE.md
```

Expected:

- `.claude/skills` points to `../.agents/skills`.
- `find -L .claude/skills` shows the same skills as `.agents/skills`.
- `CLAUDE.md` imports `@AGENTS.md` and does not describe a separate source of
  truth.

If `.claude/skills` is a real directory with per-skill symlinks, replace it with
one folder-level symlink:

```bash
find .claude/skills -mindepth 1 -maxdepth 1 -type l -delete
rmdir .claude/skills
ln -s ../.agents/skills .claude/skills
```

Use this only after verifying `.claude/skills` contains no real user-authored
files.

## Hook Compatibility

Keep hook logic in `.agents/scripts/` and use agent-specific config files only as
thin launchers:

- Claude Code: `.claude/settings.json`
- Codex: `.codex/hooks.json`
- GitHub Copilot: `.github/hooks/*.json`

Shared hook scripts should handle both payload dialects when they inspect input:

- Claude/Codex: `tool_input`, `tool_name`, `stop_hook_active`
- GitHub Copilot: `toolArgs`, `toolName`, `agentStop`

When a hook blocks work, emit both styles when relevant:

- Exit code `2` or `{ "decision": "block" }` for Claude/Codex behavior.
- `permissionDecision: "deny"` or compatible JSON for Copilot behavior.

Use `Stop` / `agentStop` for end-of-turn behavior such as staging completed
agent work or running final validation. In this repo, `stage-agent-changes.sh`
intentionally stages all unignored repo changes with `git add -A` so the commit
skill can commit the completed turn without a manual staging step.

## Validation

Run these checks after changing skills or cross-agent wiring:

```bash
test -f .agents/skills/<skill-name>/SKILL.md
test ! -e .agents/skills/<skill-name>/agents/openai.yaml
find .agents/skills -maxdepth 2 -type f | sort
find -L .claude/skills -maxdepth 2 -type f | sort
rg -n --glob '!**/skill-generation/SKILL.md' "\.github/skills|\.codex/skills|agents/openai\.yaml|\.claude/skills/[^ ]" AGENTS.md CLAUDE.md .claude .codex .github .agents/skills
```

The `rg` command should not find stale source-of-truth references. Legitimate
matches to `.claude/skills` as a folder-level symlink are acceptable.

## Commit Shape

Prefer one commit when the change is one coherent cross-agent tooling update,
for example:

```text
feat(agents): add skill-generation workflow
```

Split commits when skill content, hook behavior, and unrelated repo docs change
for separate reasons.
