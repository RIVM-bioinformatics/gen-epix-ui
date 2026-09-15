# @gen-epix/ui-core-components [beta]

Reusable React and MUI components for Gen-EpiX frontend applications.

## About @gen-epix/ui-core-components

`@gen-epix/ui-core-components` contains shared UI building blocks that can be
used independently of the domain-specific Gen-EpiX clients, including:

- dialogs and confirmation controls
- loading indicators, spinners, and progress components
- nested menus
- steppers
- dialog and component configuration helpers

The package depends on `@gen-epix/ui-core` for framework-agnostic primitives and
uses MUI and React as peer dependencies.

## Installation

```sh
pnpm add @gen-epix/ui-core-components @gen-epix/ui-core @mui/material react
```

## Usage

Import components from their public subpath exports:

```tsx
import { Dialog } from '@gen-epix/ui-core-components/components/Dialog';
import { Spinner } from '@gen-epix/ui-core-components/components/Spinner';
```
