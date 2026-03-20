# Admin Portal — Coding Guidelines

This document defines the **coding standards, UI/UX rules, responsive behavior, and project structure** for the Admin Portal frontend project.

All developers **must strictly follow these rules** to ensure consistency, scalability, and maintainability.

> ⚠️ Do not introduce new technologies, libraries, UI frameworks, or folder structures without approval.

---

## Tech Stack (Fixed)

- **Language:** JavaScript (ES6+)
- **Framework:** React
- **Styling:** External CSS files only
- **State Management:** Zustand
- **API Layer:** WebApiManager
- **Directory Structure:** Root-based (no `src/` directory)

---

## Project Structure

The project uses a flat, root-level structure.
```
/components
/pages
/hooks
/store
/services
/styles
/utils
/constants
/assets/svgs
/public/images
```

### Folder Responsibilities

- **components/** – Reusable UI components
- **pages/** – Page-level components (screens/routes)
- **hooks/** – Custom React hooks
- **store/** – Zustand state stores
- **services/** – API logic using WebApiManager
- **styles/** – Global and shared CSS files
- **utils/** – Helper and utility functions
- **constants/** – API endpoints & environment configs
- **assets/svgs/** – SVG icons and vector assets
- **/public/images/** – Static images (avoid when possible)

❌ Do not add new folders  
❌ Do not introduce a `src/` directory  

---

## File Naming Conventions

| File Type | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `usertable.jsx` |
| Pages | PascalCase | `dashboard.jsx` |
| Hooks | camelCase (`use*`) | `useauth.js` |
| Zustand Stores | camelCase | `authStore.js` |
| Services | camelCase | `userService.js` |
| CSS Files | kebab-case | `user-table.css` |
| Utilities | camelCase | `dateUtils.js` |

---

## JavaScript Guidelines

- Use modern **ES6+ syntax**
- Use `const` and `let` (do not use `var`)
- Avoid unused variables and dead code
- Keep functions small and focused
- Use optional chaining (`?.`) where appropriate
- **Do not use TypeScript**

---

## React Guidelines

- Use **function components only**
- One component per file
- Keep JSX readable and simple
- Extract reusable logic into custom hooks
- Avoid deeply nested JSX
- Do not use class components

---

## Styling Rules (External CSS Only)

- Use only `.css` files
- One CSS file per component or page when possible
- Import CSS files directly into components
- Use descriptive and scoped class names
- ❌ No inline styles
- ❌ No CSS-in-JS
- ❌ No Tailwind, MUI, or other UI frameworks

---

## Typography

### Font
- **Font Family:** Poppins
- Imported **once globally**

### Usage At 1920px

| Text Type | Size | Weight | Color |
|-----------|------|--------|-------|
| Main Heading | 24px | Semi-Bold (600) | #F5790C |
| Sub Heading | 40px | Extra-Bold (800) | #131313 |
| Body Text | 18px | Regular (400) | #727271 |

- Spacing between heading & sub-heading: 15px
- All colors must be defined in `globals.css`.
- ❌ Do not hardcode colors inside components.
- Images & Cards border radius: **15px**
- No custom or random border-radius values

---

## Responsive Design Rules

| Device Type | Width |
|-------------|-------|
| Mobile + Tablet | Below 769px |
| Desktop & Large Screens | 769px and above |

---

## Layout Rule (Important)

- Entire project must use one common layout
- Layout must be custom-built
- Layout-related CSS must live in global styles
- Pages must not redefine layout structure
- Only two layouts exist
    - Mobile layout: < 769px
    - Desktop layout: >= 769px
- Same design applies for 769px → 1920px+
- ❌ Do not create device-specific layouts
- ❌ Do not redesign per breakpoint

---

## Icons & Assets Rules

- **Icons**
    - Use `react-icons` only
    - Import only required icons
    - ❌ Do not import full icon packs
    - ❌ Do not use image-based icons
- **SVGs**
    - Store SVGs in `/assets/svgs`
    - Prefer SVGs over static images
    - SVGs should be reusable and optimized
- **Static Images**
    - Stored only in `/public/images`
    - ⚠️ Avoid static images whenever possible

---

## State Management (Zustand)

- All global state must be managed using Zustand
- Create one store per domain (auth, users, settings, etc.)
- Do not manage shared state directly inside components

---

## Constants

- API base URLs
- API endpoints
- Environment-based configurations

---

## Google APIs, Analytics & Clarity

- **Storage Rules**
    - Store all keys and IDs in environment variables
    - ❌ Never hardcode keys
- **Usage Rules**
    - Initialize analytics once at app root
    - Enable analytics only in production
    - ❌ Do not initialize inside components repeatedly

---

## API Guidelines (WebApiManager)

- All API calls must go through `WebApiManager`
- API logic must live inside the `services/` folder
- Components must never call APIs directly

---

## Hooks Rules

- Hooks must start with `use`
- Hooks must be placed inside the `hooks/` folder
- Hooks must not return JSX
- Hooks should contain reusable logic only

---

## Code Quality Rules

- Remove `console.log` statements before committing
- Do not leave commented-out code
- Keep imports clean and ordered
- Do not add mock or dummy data in real application flows

---

## Environment Rules

- Do not hardcode API URLs or secrets
- Use the existing environment configuration
- Do not overwrite environment files

---

## Strict Do-Not List

❌ TypeScript  
❌ MUI / Tailwind / UI libraries  
❌ Inline styles  
❌ CSS-in-JS  
❌ New state management libraries  
❌ New folder structures  
❌ `src/` directory  

---

## Final Rule

Consistency over preference.
Follow existing project patterns even if you prefer a different approach.
