This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

```
AdamantFiSite
├─ .eslintrc.json
├─ .git
├─ .gitignore
├─ .next
├─ README.md
├─ bun.lockb
├─ components
│  ├─ CoolBox.tsx
│  ├─ Footer.tsx
│  ├─ InfoBox.tsx
│  ├─ SVG
│  │  └─ logo.tsx
│  ├─ app
│  │  ├─ ImageWithPlaceholder
│  │  │  └─ index.tsx
│  │  ├─ UserWallet.tsx
│  │  ├─ atoms
│  │  │  ├─ InputLabel.tsx
│  │  │  ├─ LeftCryptoInput.tsx
│  │  │  ├─ ResponsiveVegaChart.tsx
│  │  │  ├─ Swap
│  │  │  │  └─ AmountInput.tsx
│  │  │  ├─ SwapButton.tsx
│  │  │  └─ TokenDropdownHeader.tsx
│  │  ├─ compositions
│  │  │  └─ AppLayout.tsx
│  │  ├─ molecules
│  │  │  ├─ PlaceholderFromHexAddress.tsx
│  │  │  └─ TokenInput.tsx
│  │  └─ organisms
│  │     ├─ Navbar.tsx
│  │     └─ SwapForm
│  │        ├─ RawAttempt.tsx
│  │        ├─ formExample.tsx
│  │        └─ index.tsx
│  └─ ui
│     ├─ button.tsx
│     ├─ command.tsx
│     ├─ dialog.tsx
│     ├─ form.tsx
│     ├─ label.tsx
│     ├─ popover.tsx
│     ├─ toast.tsx
│     ├─ toaster.tsx
│     └─ use-toast.ts
├─ components.json
├─ dev-server.js
├─ lib
│  └─ utils.ts
├─ next.config.mjs
├─ node_modules
├─ package-lock.json
├─ package.json
├─ pages
│  ├─ _app.tsx
│  ├─ _document.tsx
│  ├─ app
│  │  ├─ index.tsx
│  │  ├─ pool
│  │  │  └─ [pool].tsx
│  │  ├─ pools
│  │  │  └─ index.tsx
│  │  ├─ token
│  │  │  └─ [token].tsx
│  │  └─ tokens
│  │     └─ index.tsx
│  └─ index.tsx
├─ postcss.config.js
├─ public
│  ├─ Adamant-bg-dark.png
│  ├─ android-chrome-192x192.png
│  ├─ android-chrome-512x512.png
│  ├─ apple-touch-icon.png
│  ├─ browserconfig.xml
│  ├─ favicon-16x16.png
│  ├─ favicon-32x32.png
│  ├─ favicon.ico
│  ├─ icons
│  │  └─ coolBox
│  │     ├─ 1.svg
│  │     ├─ 2.svg
│  │     └─ 3.svg
│  ├─ images
│  │  ├─ Adamant-bg-dark.png
│  │  └─ Adamant-bg-light.png
│  ├─ mstile-144x144.png
│  ├─ mstile-150x150.png
│  ├─ mstile-310x150.png
│  ├─ mstile-310x310.png
│  ├─ mstile-70x70.png
│  ├─ safari-pinned-tab.svg
│  └─ site.webmanifest
├─ styles
│  └─ globals.css
├─ tailwind.config.ts
├─ tsconfig.json
├─ types
│  └─ index.ts
└─ utils
   ├─ ImageWithPlaceholder
   │  ├─ addressTo3Colors.tsx
   │  └─ stringToHex.tsx
   └─ dummyData
      ├─ lineChart.json
      ├─ lineChartValues.json
      └─ sspairs.json
```
