# Infrastructure

Terraform config for the `gyeongho.dev` apex (A) and `www` (CNAME) DNS records in Cloudflare. Other records (mail, `blog`, ...) are not managed here.

State lives in HCP Terraform, organization `ghkim`, workspace `gyeongho-dev`.

## Setup

1. Run `terraform login` once.
2. Set the workspace execution mode to Local (state only). The Cloudflare provider then reads `CLOUDFLARE_API_TOKEN` from your shell. If you keep remote execution instead, set `CLOUDFLARE_API_TOKEN` as a sensitive workspace environment variable.
3. Export the token. Never write it to a file.

```sh
export CLOUDFLARE_API_TOKEN=...
```

## Commands

```sh
mise run infra:init    # terraform init (connects to HCP Terraform)
mise run infra:check   # fmt -check, init -backend=false, validate
mise run infra:plan
mise run infra:apply
```

## Record values

`vercel_apex_ip` (`76.76.21.21`) and `vercel_www_target` (`cname.vercel-dns.com`) are the documented Vercel defaults. Confirm them against the Vercel domain settings before any apply. Records are not proxied so Vercel can issue the TLS certificate.

## Importing existing records

Import before the first apply so Terraform adopts the records instead of creating duplicates. The import ID format for provider v5 is `<zone_id>/<dns_record_id>`.

```sh
terraform -chdir=infra import cloudflare_dns_record.apex '<zone_id>/<apex_record_id>'
terraform -chdir=infra import cloudflare_dns_record.www '<zone_id>/<www_record_id>'
```

Find the zone ID and record IDs in the Cloudflare dashboard or with `GET /zones/<zone_id>/dns_records`. Run `mise run infra:plan` afterwards and confirm it shows no unintended changes.
