# Water Log

Mobile-first water intake tracker. Spec: [spec.md](spec.md). Domain language: [CONTEXT.md](CONTEXT.md).

## Develop

```bash
pnpm install
pnpm dev
```

## Test / build

```bash
pnpm test
pnpm build
```

## Deploy

Pushes to `main` run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the app and publishes it to GitHub Pages.

One-time setup in the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Site URL: https://ajcousins.github.io/water-log/
