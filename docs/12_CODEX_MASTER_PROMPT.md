# Codex Master Prompt

/goal

Implement LabDelta from the frozen specification in this repository. Read all files in `docs/` as authoritative. Do not redesign or add features.

## Resource discipline

- One main thread.
- No subagents.
- No parallel work.
- Sequential stages and a commit after each stage.
- Short progress messages.
- Official technical documentation only when necessary.
- Never invent token or usage data.
- The user wants to preserve at least 50% of the external weekly allowance. You cannot guarantee or enforce that threshold. Therefore complete **Stage 1 only**, stop, and instruct the user to inspect the external usage meter before continuing.

## Stage 1 — Scaffold and static UI shell

- Tauri 2 + React + TypeScript + Rust.
- Cross-platform source tree.
- Implement both supplied mockups as data-driven screens.
- Global dashboard and patient workspace.
- Static synthetic data only.
- Type checks, tests, lint, production frontend build, Tauri development validation.
- Commit.

## Later stages

2. SQLite data model and reproducible JSON/CSV/text-PDF demo.
3. Deterministic analysis engine and profiles.
4. Import with double patient identity protection.
5. charts, source viewer, CI, documentation, contest package, final build.

## Non-negotiable

No diagnosis, probabilities, treatment, test recommendation, causal claims, runtime LLM, telemetry, patient-data network calls, invented intervals, silent conversions, or unverified patient assignment.

## Stage response

Report only: completed stage, files/modules, exact validation results, commit SHA, limitations, and instruction to check the external usage meter.

Begin with Stage 1 only.
