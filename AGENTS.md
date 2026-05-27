# AGENTS.md

## Stack
- Next.js 16 (App Router), React 19, TypeScript 5, pnpm
- shadcn/ui (Radix + Tailwind CSS v4), `tw-animate-css`
- Clerk (auth), Turso/libSQL (Drizzle ORM), Cloudflare R2 (GLB storage), Cloudinary (images)
- React Three Fiber / Three.js for 3D

## Commands
```bash
pnpm dev        # Start dev server (port 3000)
pnpm build      # Production build
pnpm lint       # ESLint (next/core-web-vitals + typescript)
```

No test scripts are configured.

## Architecture

### Route Groups
- `app/(public)/` — landing page (unauthenticated)
- `app/(auth)/` — Clerk sign-in / sign-up pages
- `app/(dashboard)/` — authenticated dashboard with sidebar layout
- `app/editor/[id]/` — project editor
- `app/embed/[id]/` — public embed viewer
- `app/api/proxy/` — proxies R2 GLB assets; validates embed tokens and referrer
- No `app/v/[id]/` implementation yet (short URL placeholder)

### Auth (Clerk)
- Middleware is at `proxy.ts:1` (NOT the standard `middleware.ts` — naming is intentional).
- Public routes: `/`, `/sign-in`, `/sign-up`, `/embed/*`, `/api/proxy*`, `/api/webhook*`
- All other routes are protected via `auth.protect()`.

### Database (Turso / Drizzle)
- DB schema: `src/db/schema.ts`
- DB client: `src/index.ts` (exports `db`)
- Config: `drizzle.config.ts` — requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars
- No existing migrations (no `drizzle/` directory yet)
- To generate migrations: `npx drizzle-kit generate`
- To push schema: `npx drizzle-kit push`

### Path Alias
- `@/*` maps to `./*` (project root), NOT `./src/*`
- Usage: `@/lib/utils`, `@/components/ui/button`, `@/src/db/schema`

### 3D Pipeline
- GLB files uploaded to Cloudflare R2 (`pub-9e69d67f0bf3407992765577a7c517ea.r2.dev`)
- Images/thumbnails uploaded to Cloudinary
- `app/api/upload/` handles direct file uploads
- `components/3d/R3FViewer.tsx` — core 3D viewer component

### Embed Security
- Custom HMAC-SHA256 token system in `lib/embed-auth.ts`
- `lib/project-embed-access.ts` manages active tokens per project
- `lib/project-embed-domains.ts` manages allowed embed domains

### Theme
- Forced dark mode by default (`next-themes` with `defaultTheme="dark"`, `enableSystem={false}`)
- Uses CSS custom properties via shadcn's Tailwind v4 + `tw-animate-css`

## Env Vars (required)
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLOUDINARY_URL` (or `CLOUDINARY_CLOUD_NAME` + `API_KEY` + `API_SECRET`), R2 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`), `EMBED_TOKEN_SECRET`

## Constraints
- Free tier: max 5 projects (`MAX_PROJECTS_FREE` in `lib/constants.ts`), 50MB file limit, `.glb` only
- Server action body size limit: 50MB
- shadcn components are at `components/ui/` (Radix Nova style, `rsc: false`)
