# My Turborepo

Template scaffold for professional, highly decoupled web applications with React + Vite, shared UI, flexible state management, reusable infrastructure packages, and a dedicated Storybook app to start developing quickly.

## Quick Start

Install dependencies:

```sh
pnpm install
```

Run the main app:

```sh
pnpm --filter web dev
```

Run the production app (koop):

```sh
pnpm --filter koop dev
```

Run the sample auth API:

```sh
pnpm --filter auth-api dev
```

Run Storybook:

```sh
pnpm --filter storybook dev
```

Build everything:

```sh
pnpm build
```

## Workspace Layout

### Apps

- `apps/koop`: production React + Vite application (KOOP Strategic Advisory website and client portal)
- `apps/web`: reference React + Vite application demonstrating monorepo best practices
- `apps/auth-api`: sample Express API for custom and mixed authentication flows
- `apps/storybook`: isolated component showcase for `@repo/ui`

### Packages

- `packages/ui`: shared design system components and Sass styles
- `packages/state`: shared state package with Redux and Zustand implementations
- `packages/hooks`: shared business and UI hooks
- `packages/api`: API client helpers with pluggable fetch and axios providers
- `packages/auth`: shared auth providers for Azure, Firebase, and custom API backends
- `packages/infrastructure`: infrastructure adapters and providers
- `packages/persistence`: persistence helpers
- `packages/math`: sample shared utilities
- `packages/types`: shared TypeScript types
- `packages/utils`: general utilities
- `packages/eslint-config`: shared ESLint configuration
- `packages/typescript-config`: shared TypeScript configuration

## State Management

This workspace supports two state management libraries: **Redux Toolkit** and **Zustand**.

The `@repo/state` package is organized by implementation:

```text
packages/state/src/
  shared/    # shared RootState types, selectors, and StateManager contract
  redux/     # Redux store, slices, hooks, and ReduxStateManager
  zustand/   # Zustand store, hooks, and ZustandStateManager
  managers/  # agnostic factory/provider/hooks built on the shared contract
```

The app includes a runtime toggle on the Home page so you can compare Redux and Zustand with the same features.

### Recommended Usage

Use the agnostic hooks from `@repo/state` when you want components to stay independent from the underlying implementation:

```ts
import {
  useAgnosticCounter,
  useAgnosticContactForm,
  useAgnosticFeedbackForm,
} from "@repo/state";
```

If you want to choose an implementation directly:

```ts
import {
  ReduxStateManager,
  ZustandStateManager,
  StateManagerFactory,
} from "@repo/state";
```

## UI and Styling

The shared UI library lives in `packages/ui` and follows Atomic Design.

Current UI layers:

- Atoms: `Button`, `Input`, `Label`, `Rating`, `Select`, `Textarea`
- Molecules: `Counter`
- Organisms: `Header`, `FeedbackForm`

Styling is based on **Sass/SCSS**:

- `packages/ui` uses **SCSS Modules** for reusable component styles
- `apps/web` uses app-level SCSS for page and layout styling
- shared tokens and mixins live under `packages/ui/styles`

## API and Auth Providers

This workspace now includes a provider-based auth layer:

- `AzureAuthProvider` for Microsoft / Azure SSO
- `FirebaseAuthProvider` for Firebase Auth popup flows
- `CustomApiAuthProvider` for your own backend, implemented on top of `createFetchApiClient` from `@repo/api`
- `MixedAuthProvider` for SSO identity plus backend authorization claims

All auth providers now persist the normalized session through `@repo/persistence`, so access control can evaluate the last known user, roles, permissions, claims, and tokens from local storage.

The web app includes a dedicated login demo page that exercises those providers through a shared login component, while Home stays focused as the quick view.

Useful package docs:

- `packages/api/README.md`
- `packages/auth/README.md`

## Storybook

Storybook runs as its own app in `apps/storybook` and loads stories colocated with components in `packages/ui`.

Common commands:

```sh
pnpm --filter storybook dev
pnpm --filter storybook build
```

More guidance is available in `apps/storybook/README.md`.

## Tooling

This workspace uses:

- TypeScript
- Vite
- Turbo
- Sass
- ESLint
- Prettier
- Storybook

## Commit Conventions

This project follows [Conventional Commits](https://conventionalcommits.org/). See [COMMIT_CONVENTIONS.md](COMMIT_CONVENTIONS.md) for details.

Generate or refresh the local draft commit message with:

```sh
pnpm run update-commit-msg
```

Recommended commit flow:

```sh
git add .
pnpm run update-commit-msg
git commit -F COMMIT_MESSAGE.txt
```

`COMMIT_MESSAGE.txt` is a local draft file used by the repository tooling and is intentionally ignored by git.
