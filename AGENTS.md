# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project-Specific Patterns

### Coding
- review existing files in project and avoid duplication

#### Project structure
- see `App.tsx` for routes
- components live in `/src/components`
- game data including maps, heroes, creatures etc live in `/src/data` 

#### Do
- use MUI v3. make sure your code is v3 compatible
- use emotion `css={{}}` prop format
- use mobx for state management with `useLocalStore`
- after completing every task, run `npm install && npm run build` and fix all build errors before starting a new task
- after completing every task and fixing all build errors, update task state in file tasks.md moving OPEN tasks to IN_PROGRESS or DONE based on how much was completed
- after completing every task, fixing all build errors and updating file tasks.md, ask permission to run a command `git add . && git commit -m "DESCRIPTION"`, replacing "DESCRIPTION" with a short description of what has changed in the project since the last code commit (3 sentences max)
- use design tokens from `DynamicStyles.tsx` for all styling. avoid hard coded styles in the source files. keep style and design consistent.
- default to small components
- default to small files and diffs
- use Vite for hot deploy

When using CLI tools:
- Combine related commands into ONE execution block.
- Avoid running commands sequentially when they can be composed.
- Use comments above each command to explain intent.
- After executing, validate the result using CLI or filesystem checks.
    # BAD: 3 separate CLI calls
    mkdir src
    mv file.js src/
    ls src

    # GOOD: single bundled call
    mkdir -p src && mv file.js src/ && ls -l src


#### Don't
- do not hard code colors
- do not use `div`s if we have a component already
- do not add new heavy dependencies without approval

### Git Commit Standardization
Agents must follow the same commit style every time.

#### Commit Message Format
<type>(scope): <short description>

Longer explanation (if needed).
- Bullet 1
- Bullet 2

Refs: #ticket or PR link

#### Allowed Commit Types
feat – new functionality
fix – bug fix
chore – non-feature updates
refactor – structure change without behavior change
docs – documentation updates
test – test-related changes
build – CI/CD or build scripts


#### Rules for Commit Creation
- Summaries must be <= 60 characters.
- Never include personal opinions.
- Always describe the change, not the intention.
- Group related file changes into one commit.
- Do not create more than 5 commits per task unless requested.


### Code Generation Rules
- Prefer minimal working examples over large boilerplate.
- Include comments only when they add value.
- Validate code using built-in linters if available.
- Never mix unrelated concerns in a single code block.
- Predict file paths precisely before writing.
- When modifying an existing file, show ONLY the diff unless full file rewrite is required.

### Output Formatting Rules
- Always use consistent markdown.
- No trailing whitespace.
- Code must always specify language fences.
- Multi-step reasoning must follow numbered lists.

### Context Handling
- Carry forward only relevant context.
- Never assume past instructions override current ones.
- Summarize context when the conversation is long.

### Performance Rules
- Minimize round‑trip interactions.
- Prefer bulk operations.
- When generating multiple files, output them in a single response.
- Use caching when available.

### Image Generation
- Use CLI `node src/cli/image-export-cli.ts --collections heroes --force_overwrite --force_png --force-no-safe --seed 1` to generate missing hero PNGs
- Images are saved to `/public/assets/images` and referenced as `/assets/images/<filename>.png`

### Battle Victory Flow
- On victory: update resources, remove defeated creature from map via `defeatedCreatureId` and `onCreatureDefeated` props
- Resources are passed down through props and updated at App level

### Quest System
- Quest rewards are handled in TownScreen modal only
- Quest data includes acceptance/completion logic with resource rewards