# HACK-CTF

## Environment variables

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_HOSTNAME` (optional, e.g. `<project-ref>.supabase.co`) for `next/image` remotePatterns.

### Rate limiting (required on Vercel)
This project uses Upstash Redis for rate limiting in production.
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Logs / Observability (Axiom / Logtail)
(TODO) Add provider-specific env vars once integrated.
