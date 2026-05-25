# Olympus Exchange

Static browser game for Monad with Reown AppKit wallet connection and an optional on-chain contract for paid continues.

## Local Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Check

```bash
npm run check
```

## Contract

The Solidity contract is in `contracts/OlympusExchange.sol`.

It records:

- paid continues through `payToContinue()` or a plain MON transfer to the contract;
- daily check-ins through `checkIn()`;
- score submissions through `submitScore()`;
- owner withdrawals to the treasury wallet.

Install dependencies:

```bash
npm install
```

Compile:

```bash
npm run contract:compile
```

Create `.env` from `.env.example` and put the deployer private key there. Never commit `.env`.

Deploy to Monad mainnet:

```bash
npm run contract:deploy
```

After deploy, write the contract address into `index.html`:

```bash
npm run contract:set-address
```

Then commit and push:

```bash
git add index.html deployments/monad-mainnet.json
git commit -m "Connect game to OlympusExchange contract"
git push
```

## GitHub

Repository:

```text
https://github.com/GxOlympus/olympus-exchange
```

## Vercel

1. Open https://vercel.com/new
2. Import the GitHub repository.
3. Framework Preset: Other.
4. Build Command: leave empty.
5. Output Directory: leave empty.
6. Deploy.

After Vercel gives a production domain, add it to the Reown project dashboard and verify the domain.
