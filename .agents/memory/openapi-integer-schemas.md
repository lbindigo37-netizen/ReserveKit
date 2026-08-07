---
name: OpenAPI integer schemas
description: Compatibility note for generated Zod contracts in this workspace.
---

The current Orval/Zod combination in this workspace emits `zod.int()` for OpenAPI `integer` fields, while the installed Zod package does not expose that API. Use OpenAPI `number` for generated numeric IDs, counts, and durations unless the generator dependency is upgraded together with the schema output.

**Why:** Code generation succeeds, but the workspace library typecheck fails on the generated Zod file when integer schemas are present.

**How to apply:** When adding or changing OpenAPI contracts, prefer `number` for values that only need numeric validation in this workspace and rerun API codegen plus the library typecheck.