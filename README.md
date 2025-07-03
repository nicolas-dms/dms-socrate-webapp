# DMS Socrate Webapp

## Purpose
DMS Socrate is a modern educational web application designed to provide a clean, multilingual, and user-friendly interface for students and educators. It features authentication via magic link (email code), a collapsible sidebar menu, and is ready to connect to a FastAPI backend for advanced educational services.

## Technical Structure
- **Framework:** Next.js (React, App Router, TypeScript)
- **UI:** React-Bootstrap, custom CSS (beige/soft theme)
- **State Management:** React Context (see `context/AuthContext.tsx`)
- **Authentication:** Magic link (email + code, mocked for now)
- **i18n:** react-i18next, with English and French translations
- **API Calls:** Axios (ready to connect to FastAPI backend)
- **Routing:** Next.js App Router, with protected routes using `components/ProtectedPage.tsx`

## Main Folders & Files
- `app/` — Main Next.js app directory (pages, layout, etc.)
- `components/` — Shared React components (SidebarLayout, ProtectedPage, etc.)
- `context/AuthContext.tsx` — Authentication context/provider
- `i18n/` — Internationalization config and translation files
- `public/` — Static assets (icons, images)
- `app/login/page.tsx` — Login page (magic link flow)
- `app/profile/page.tsx` — Example protected page
- `app/settings/page.tsx` — Settings page
- `app/about/page.tsx` — About page

## Main Configuration
- **Theme/Styles:** `app/globals.css`
- **i18n:** `i18n/i18n.ts`, `i18n/locales/en.json`, `i18n/locales/fr.json`
- **Auth:** `context/AuthContext.tsx`
- **Sidebar/Menu:** `components/SidebarLayout.tsx`

## Common Commands
- `npm install` — Install dependencies
- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Build for production
- `npm run start` — Start production server
- `git add .` — Stage all changes
- `git commit -m "message"` — Commit changes
- `git push` — Push to remote repository

## Notes
- The login flow is currently mocked for development. Integrate with your FastAPI backend for production.
- Update translation files in `i18n/locales/` for more languages or new keys.
- Customize the sidebar and theme in `SidebarLayout.tsx` and `globals.css`.

---
For any questions or contributions, please contact the project maintainer.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
