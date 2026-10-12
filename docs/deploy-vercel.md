# Deploying Likeness to Vercel (https://likeness.website)

A new Vercel project, built from this repository, serving the Arbitrum Sepolia deployment at
`https://likeness.website`. Nothing here touches any other Vercel project.

## 1. Project setup

1. **Add New → Project**, import `rohitshukla11/likeness.website`, set **Root Directory** to `web`, and
   leave the framework as Next.js. The install and build commands come from `web/vercel.json` (pnpm 12,
   so the C2PA native binding is fetched); Node 22 comes from `web/package.json`. Keep Fluid compute on.
   Don't deploy yet, or let the first deploy fail: the public variables must be set first.
2. **Storage → Create → Blob**, private, and connect it to this project only. This sets
   `BLOB_READ_WRITE_TOKEN`. Use a new store: the vault, app records, renders and history cache live there.
3. In your own terminal (it asks you to log in and pick the project, so do it yourself):

   ```sh
   cd ~/likeness-arbitrum/web
   npx vercel login
   npx vercel link                                  # choose the NEW project created in step 1
   sh scripts/vercel-env.sh https://likeness.website
   ```

   The script prints the linked project's name, the site URL and the secrets folder
   (`~/likeness-arbitrum/.secrets`), and writes nothing until you type the project's name back. It reads
   values from `web/.env.local` and `.secrets/` and pipes them to the Vercel CLI without printing them.
   It sets `NEXT_PUBLIC_APP_URL=https://likeness.website` and `NEXT_PUBLIC_RP_ID=likeness.website` from
   the URL you pass.

## 2. Domains

In the project's **Settings → Domains**:

1. Add `likeness.website`, then `www.likeness.website`.
2. Make `likeness.website` the primary domain and set `www.likeness.website` to **redirect** to it (308).
3. At the registrar, set the records the domain cards show. Vercel's defaults
   ([docs](https://vercel.com/docs/domains/working-with-domains/add-a-domain)):

   | Host | Type | Value |
   |---|---|---|
   | `@` (likeness.website) | A | `76.76.21.21`, or the IP on the domain card |
   | `www` | CNAME | the project-specific value on the domain card (e.g. `xxxxxxxx.vercel-dns-017.com`) |

   Remove any other A, AAAA or CNAME records for those two names. If the domain is used by another Vercel
   account, Vercel asks for a TXT verification record first.

Passkeys are bound to `likeness.website`, which covers `www.likeness.website` too. Preview deployments on
`*.vercel.app` can't open photos sealed on production.

## 3. Dynamic (Sandbox environment)

- **Chains:** Arbitrum Sepolia enabled (EVM). The app pins it as its only network.
- **Allowed origins** (Developers → Security / CORS): `https://likeness.website`,
  `https://www.likeness.website`, and the project's `https://<project>.vercel.app`.

## 4. Before going live

1. **Fund the gas top-up wallet** `0x72507159071dFDd6148c079Fe0be46AcBaC6aD2E` with **0.0015 ETH** on
   Arbitrum Sepolia: 0.0002 ETH per new wallet (about 20 transactions at 0.02 gwei) for five users, plus
   room for the top-ups' own gas and retries.
2. **Redeploy without the build cache** (Deployments → ⋯ → Redeploy, untick "Use existing Build Cache"),
   because `NEXT_PUBLIC_*` values are compiled into the page.
3. **Check** `https://likeness.website/api/status`. Healthy looks like:
   - `"chain": "Arbitrum Sepolia"`;
   - `configured: true` for `dynamic`, `gas-drip`, `didit`, `face-models`, `gemini`, `render-agent` and
     `c2pa`;
   - `envio` false is expected: history is read from the chain over RPC;
   - `dynamic-delegation`, `dynamic-agent`, `email-codes` and `brand-kyb` may be false (optional).

   `/status` shows the same, plus the four contracts with Arbiscan links.
4. Optionally, point Didit's webhook at `https://likeness.website/api/didit/webhook` (otherwise the server
   polls Didit).

## Environment variables

🔒 secret (set as sensitive). "Script" means `scripts/vercel-env.sh` sets it.

| Variable | Secret | Required | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | | yes | `https://likeness.website` (script) |
| `NEXT_PUBLIC_RP_ID` | | yes | `likeness.website` (script) |
| `NEXT_PUBLIC_DYNAMIC_ENV_ID` | | yes | Dynamic Sandbox environment ID (script) |
| `NEXT_PUBLIC_RPC_URL` | | optional | Browser RPC; defaults to `https://sepolia-rollup.arbitrum.io/rpc` |
| `RPC_URL` | 🔒 | optional | Server RPC; a provider endpoint with its own key is steadier than the public one |
| `STORE_DRIVER` | | yes | `blob` (script) |
| `BLOB_READ_WRITE_TOKEN` | 🔒 | yes | Set by connecting the Blob store |
| `ATTESTER_PRIVATE_KEY` | 🔒 | yes | From `.secrets/attester.key` (script) |
| `RENDER_AGENT_PRIVATE_KEY` | 🔒 | yes | From `.secrets/render-agent.key`, registered on the escrow (script) |
| `DRIP_PRIVATE_KEY` | 🔒 | yes | From `.secrets/drip.key` (script) |
| `DRIP_AMOUNT_ETH`, `DRIP_PER_IP_PER_HOUR`, `DRIP_PER_HOUR` | | optional | Defaults 0.0002, 3, 30 |
| `C2PA_CERT_PEM`, `C2PA_KEY_PEM` | 🔒 | yes | Test signing chain from `.secrets/c2pa` (script) |
| `DIDIT_API_KEY` | 🔒 | yes | |
| `VERIFICATION_LEVEL` | | yes | `free` or `full` |
| `DIDIT_WORKFLOW_ID_FREE`, `DIDIT_WORKFLOW_ID_FULL` | | yes | The workflow for the chosen level |
| `DIDIT_CAPTURE_MATCH_THRESHOLD` | | optional | |
| `DIDIT_WEBHOOK_SECRET` | 🔒 | optional | Only with the Didit webhook |
| `GEMINI_API_KEY` | 🔒 | yes | Billed key; without it renders are refused |
| `GEMINI_IMAGE_MODEL`, `GEMINI_IMAGE_SIZE`, `GEMINI_FILTER_MODEL` | | optional | |
| `RESEND_API_KEY` | 🔒 | optional | Emailed domain-check codes for brands |
| `MAIL_FROM` | | optional | |
| `ENVIO_GRAPHQL_URL` | | optional | A hosted Envio indexer; without it history comes from RPC |
| `ENVIO_GRAPHQL_SECRET` | 🔒 | optional | |
| `DYNAMIC_API_KEY`, `DYNAMIC_WEBHOOK_SECRET`, `DYNAMIC_DELEGATION_PRIVATE_KEY_PEM`, `DYNAMIC_AGENT_JSON` | 🔒 | optional | Delegated access and a Dynamic server wallet; off by default |
| `DEV_WALLETS`, `DEV_DELEGATION`, `DEV_RENDERER` | | **leave unset** | Test wallets, test delegation and the TEST RENDER renderer |
| `NEXT_PUBLIC_HIDE_DEV_OVERLAY` | | **leave unset** | Development only |

Redis is not used: off-chain state is in the private Blob store.
