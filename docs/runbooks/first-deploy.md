# First deploy

For the owner. Everything up to the first deploy is built and tested. This
page lists what only you can do, in order, with the exact commands. Nothing here
has been run by a build session, and no session will type a secret.

Once you finish step 6, every push to `v2` deploys staging, every push to `main`
deploys production, and every pull request gets a preview address.

Commands are run from the repository root unless a step says otherwise.
Replace `<owner>` with the GitHub account that owns the repository.

## What you will create

| # | Thing | What it is for |
|---|---|---|
| 1 | A Cloudflare account | Hosts the Worker (the app and its API) and the release buckets |
| 2 | R2, turned on in that account | Object storage for release data |
| 3 | A `workers.dev` subdomain | The free address staging and production are served from until there is a domain |
| 4 | Two R2 buckets | `genomecanvas-releases-staging` and `genomecanvas-releases-production` |
| 5 | One API token for GitHub Actions | Lets CI upload releases and deploy the Worker, and nothing else |
| 6 | Two repository secrets | Give that token and your account ID to the workflows |

## 1. Create the Cloudflare account

Sign up at <https://dash.cloudflare.com/sign-up> and verify your email. The free
plan is enough (see "What it costs" below).

Your **account ID** is 32 hexadecimal digits. In the dashboard, open
**Workers & Pages**; it is shown on the right under "Account ID". It is not a
secret, but keep it out of the repository anyway.

## 2. Turn on R2

In the dashboard, open **R2 Object Storage** and follow the prompt to enable it.
Cloudflare may ask for a payment method before R2 can be used, even though
usage inside the free allowance is not charged. That is a Cloudflare
requirement; nothing in this project needs more than the free allowance today.

## 3. Choose a workers.dev subdomain

In **Workers & Pages**, Cloudflare asks you to pick a subdomain the first time
(for example `yourname.workers.dev`). The sites will then be:

- staging: `https://genomecanvas-staging.<subdomain>.workers.dev`
- production: `https://genomecanvas-production.<subdomain>.workers.dev`
- pull request 12: `https://pr-12-genomecanvas-staging.<subdomain>.workers.dev`

The Worker configuration already turns on the workers.dev address for both
environments and preview addresses for staging (`apps/web/wrangler.jsonc`).

## 4. Create the two buckets

Pick **one** of the two ways. Both create exactly the same buckets.

### Either: with OpenTofu (the infrastructure code)

This needs a short-lived token of its own. In the dashboard: **My Profile → API
Tokens → Create Token → Create Custom Token**. Give it:

- Permissions: **Account → Workers R2 Storage → Edit**. Nothing else.
- Account resources: **Include → your account** only.
- TTL: end date one day from now.

Then, in your own terminal (OpenTofu installed with `brew install opentofu`, or
use `infra/tofu.sh` in place of `tofu`, which runs it through Docker):

```bash
cd infra/cloudflare
cp terraform.tfvars.example terraform.tfvars
```

Open `terraform.tfvars` and replace the example with your account ID. Then:

```bash
read -rs CLOUDFLARE_API_TOKEN && export CLOUDFLARE_API_TOKEN
tofu init
tofu plan
tofu apply
unset CLOUDFLARE_API_TOKEN
```

`read -rs` waits for you to paste the token without showing it or saving it in
your shell history. `tofu plan` should list exactly two buckets to add.
`terraform.tfvars` and the state file are ignored by git. Delete the token in
the dashboard when you are done.

### Or: with wrangler, without installing OpenTofu

```bash
cd apps/web
corepack pnpm exec wrangler login
corepack pnpm exec wrangler r2 bucket create genomecanvas-releases-staging
corepack pnpm exec wrangler r2 bucket create genomecanvas-releases-production
```

`wrangler login` opens a browser for you to sign in. If you later adopt
OpenTofu, bring these buckets under it with `tofu import` instead of creating
them again.

## 5. Create the API token for GitHub Actions

**My Profile → API Tokens → Create Token → Create Custom Token**:

- Token name: `genomecanvas-github-actions`
- Permissions, both under **Account**:
  - **Workers Scripts → Edit**: deploy the Worker and upload preview versions
  - **Workers R2 Storage → Edit**: upload release files and read them back
- Account resources: **Include → your account** only.
- Zone resources: none. There is no domain yet.
- TTL: an end date you will remember, such as one year from now.

Do not start from the "Edit Cloudflare Workers" template: it adds KV, routes,
logs and user permissions this project does not use. If a deploy ever fails
with an authentication error that names a missing permission, add that single
permission to this token.

Copy the token when it is shown; Cloudflare shows it once.

## 6. Store the two secrets in GitHub

With the GitHub CLI signed in to your account, run each command and paste the
value when it asks. The value is read without echoing and never touches a file
or your history.

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo <owner>/GenomeCanvas
gh secret set CLOUDFLARE_ACCOUNT_ID --repo <owner>/GenomeCanvas
```

Or in the browser: **Settings → Secrets and variables → Actions → New repository
secret**, once for each name.

## 7. Trigger the first deploy

Deploy staging first: pull request previews are versions of the staging Worker,
so they cannot be uploaded until it exists.

```bash
gh workflow run deploy.yml --repo <owner>/GenomeCanvas --ref v2
gh run watch --repo <owner>/GenomeCanvas
```

Pushing any commit to `v2` does the same. The run builds the app, uploads the
sample release to `genomecanvas-releases-staging`, deploys the
`genomecanvas-staging` Worker, then checks the address. It fails if
`/api/health` does not answer `{"status":"ok"}` or the manifest is not the one
just uploaded.

Production deploys the same way from `main`. Nothing is merged into `main`
without your say-so:

```bash
gh workflow run deploy.yml --repo <owner>/GenomeCanvas --ref main
```

## 8. Check that it worked

The deploy run's summary links the address. By hand:

```bash
curl -s https://genomecanvas-staging.<subdomain>.workers.dev/api/health
curl -sI https://genomecanvas-staging.<subdomain>.workers.dev/release/sample/manifest.json
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' -H 'Range: bytes=0-15' https://genomecanvas-staging.<subdomain>.workers.dev/release/sample/manifest.json
```

Expect `{"status":"ok"}`; then `200` with `cache-control: no-cache`; then
`206 16`, a byte range of exactly 16 bytes. Open the address in a
browser: 54 coloured points and the sample-data notice.

Open a pull request against `v2` to see a preview: a comment titled
**Preview** appears with its address and is updated on every push.

## Rolling back

Every deploy is a Worker version. To go back to the previous one:

```bash
cd apps/web
corepack pnpm exec wrangler rollback --name genomecanvas-staging
```

Use `--name genomecanvas-production` for production. `wrangler deployments list
--name <worker>` shows the versions with their commit (each deploy's message is
its commit hash), and `wrangler rollback <version-id> --name <worker>` goes to a
specific one. Both need `wrangler login` or `CLOUDFLARE_API_TOKEN` in your
shell.

Release files are never deleted and hashed files never change, so an older
Worker version still finds every file it knew. The one file that is replaced is
`manifest.json`. To restore an earlier manifest, check out the commit that built
it and upload that release again:

```bash
corepack pnpm run release:sample
corepack pnpm --filter @genomecanvas/web run release:upload ../../build/release/sample --release sample --env staging
```

That prints the plan. Add `--apply`, with `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` set in your shell, to upload.

To stop deploying altogether, delete the `CLOUDFLARE_API_TOKEN` secret; the
deploy and preview jobs go back to being skipped.

## What it costs

Read from Cloudflare's pricing and limits pages on 2026-11-25.

| Service | Free allowance | What happens beyond it |
|---|---|---|
| Workers (free plan) | 100,000 requests a day, 10 ms of CPU each | Requests fail with error 1027 until midnight UTC. Nothing is charged. The paid plan is $5 a month and includes 10 million requests |
| Static assets | Free and unlimited | — |
| R2 storage | 10 GB-month | $0.015 per GB-month |
| R2 writes (Class A) | 1 million a month | $4.50 per million |
| R2 reads (Class B) | 10 million a month | $0.36 per million |
| R2 egress | Free | — |

What uses what today:

- The app shell is static assets: free.
- Every request under `/api/` or `/release/` is a Worker request. A release file
  costs one or two R2 reads (one to check the size and entity tag, one to read
  the bytes; a `304` or a `HEAD` costs one).
- A first visit makes three release requests, so the free plan carries roughly
  30,000 first visits a day. Browsers then keep hashed files for a year and
  only revalidate the manifest.
- The sample release is under 8 KB. Each pull request adds a copy under
  `pr-<number>/` in the staging bucket, also under 8 KB, which is never
  deleted automatically.

What would start costing money: more than about 3 million release requests a
month (which would first hit the free Worker cap, not a bill), or more than
10 GB stored, which Phase 2's structure mirror could approach. Plan section
4.9 expects about $1 a month in the strict design, for the domain.

## Not covered here

- A custom domain. When there is one, releases can be served straight from R2
  on that domain, with no Worker request per file (ADR 5).
- The optional repository settings in `infra/github/` and private
  vulnerability reporting: see `infra/README.md`.
