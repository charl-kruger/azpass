# azpass

**One command to authenticate your machine with Azure DevOps npm feeds.**

[![npm version](https://img.shields.io/npm/v/azpass?color=21bb42&label=npm)](http://npmjs.com/package/azpass)
[![Release status](https://github.com/charl-kruger/azpass/actions/workflows/release.yml/badge.svg)](https://github.com/charl-kruger/azpass/actions/workflows/release.yml)

---

## Quick fix

If `npm install` just failed with `E401`, run this:

```shell
npx -y --registry https://registry.npmjs.org azpass
```

> **Why `--registry https://registry.npmjs.org`?**
> Your project's `.npmrc` points npm at your private Azure DevOps feed. Without this flag, `npx` tries to download `azpass` from that private feed — and fails, because you aren't authenticated yet. The flag tells npx to fetch the package from the public registry instead.

---

## What this tool does

Azure DevOps lets teams publish private npm packages. Consuming them requires a Personal Access Token (PAT) written to `~/.npmrc` in a specific base64-encoded format. Doing this manually means navigating Azure DevOps settings, generating a token, encoding it, and hand-editing a file — every time the token expires.

`azpass` automates all of that. It uses your existing Azure CLI login to request a PAT on your behalf and writes the correctly formatted credentials to `~/.npmrc`. On every run it performs a **safe merge** — your other registry settings and preferences are never touched.

---

## Prerequisites

1. **Azure CLI installed** — [installation guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Logged in** — run `az login` if you haven't already
3. **Your Azure DevOps organization connected to Microsoft Entra ID** — [how to connect](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/connect-organization-to-azure-ad?view=azure-devops)

Already have a PAT? Pass it directly with `--pat` or `AZDO_NPM_AUTH_PAT` to skip the Azure CLI entirely.

---

## Global config

Save your organization and feed once so every future run needs no arguments:

```shell
azpass config set organization my-org
azpass config set feed my-feed
azpass config set daysToExpiry 90
```

After that, re-authenticating is just:

```shell
azpass
```

Config is stored in `~/.config/azpass/config.json` (or `$XDG_CONFIG_HOME/azpass/config.json`).

**Config commands:**

```shell
azpass config list                   # show all saved values
azpass config get daysToExpiry       # get a single value
azpass config set email me@co.com    # set a value
```

**Valid keys:** `organization`, `project`, `feed`, `email`, `daysToExpiry`

**Precedence (lowest → highest):** global config → environment variables → CLI flags

---

## Status

Check which feeds are authenticated and when tokens expire:

```shell
azpass status
```

```
  Authenticated feeds in ~/.npmrc:

  ✓  pkgs.dev.azure.com/my-org          valid until Jun 1 2026  (in 89 days)
  ⚠  pkgs.dev.azure.com/other-org       valid until Mar 5 2026  (in 2 days)
  ✗  pkgs.dev.azure.com/old-org         expired Feb 1 2026
  ○  pkgs.dev.azure.com/legacy-org      no expiry info
```

Exits with code `1` if any token is expired, making it usable in scripts and CI health checks.

---

## Three ways to run

### 1. `parse` mode (default)

Reads your project `.npmrc`, finds the Azure DevOps registry URL, and sets up auth automatically. Right for most situations.

```shell
# Using npx (always runs the latest version)
npx -y --registry https://registry.npmjs.org azpass

# Using a global install
azpass
```

### 2. `registry` mode — supply the full URL

Skips reading the project `.npmrc` and uses the URL you provide.

```shell
azpass --registry https://pkgs.dev.azure.com/my-org/_packaging/my-feed/npm/registry/
```

### 3. `make` mode — specify org and feed

Constructs the registry URL from its components.

```shell
# Organization-scoped feed
azpass --organization my-org --feed my-feed

# Project-scoped feed
azpass --organization my-org --project my-project --feed my-feed
```

---

## Setting up for your team

**Recommended:** have each developer install once and save config once:

```shell
npm install -g azpass

azpass config set organization my-org
azpass config set feed my-feed
azpass config set daysToExpiry 90
```

After setup, they just run `azpass` whenever they hit an `E401`.

**Alternative:** add a script to `package.json` for teams that prefer not to install globally:

```json
"scripts": {
  "auth": "npx -y --registry https://registry.npmjs.org azpass"
}
```

```shell
npm run auth
```

### Why not `preinstall`?

A `preinstall` script that runs `azpass` without arguments will fail — npm reads the project `.npmrc` before running `preinstall`, hitting the auth error it was supposed to prevent.

It can be made to work by pointing the script at a `.npmrc` in a nested directory:

```json
"scripts": {
  "preinstall": "npx --yes azpass --config ./subdir/.npmrc"
}
```

Unless you already have that structure, the `auth` script approach is simpler.

---

## Expiry tracking

When azpass writes a token it includes the expiry date as a comment inside the auth block:

```
; begin auth token
; expires: 2026-06-01T00:00:00.000Z
//pkgs.dev.azure.com/my-org/...
```

This makes tokens self-describing and enables `azpass status` to show accurate expiry information.

---

## CI environments

`azpass` automatically detects CI environments (GitHub Actions, Azure Pipelines, CircleCI, and [40+ others](https://github.com/watson/ci-info#supported-ci-tools)) and exits without writing anything. CI pipelines should use their own auth mechanisms (e.g. a PAT in a secret).

To write `~/.npmrc` in CI anyway:

```shell
azpass --force
```

---

## How `~/.npmrc` is handled

`azpass` never replaces your `~/.npmrc`. On each run it:

1. Reads the existing file
2. Removes only the `; begin auth token … ; end auth token` blocks it previously wrote
3. Appends freshly generated credentials

Everything else — other registries, `engine-strict`, editor settings — is preserved.

---

## Reference

### CLI flags

| Short | Long             | Type      | Description                                                                                  |
| ----- | ---------------- | --------- | -------------------------------------------------------------------------------------------- |
| `-c`  | `--config`       | `string`  | Path to the project `.npmrc` to read. Defaults to `.npmrc` in the current directory          |
| `-o`  | `--organization` | `string`  | Azure DevOps organization name                                                               |
| `-p`  | `--project`      | `string`  | Azure DevOps project name (only required for project-scoped feeds)                           |
| `-f`  | `--feed`         | `string`  | Azure Artifacts feed name                                                                    |
| `-r`  | `--registry`     | `string`  | Full registry URL, e.g. `https://pkgs.dev.azure.com/my-org/_packaging/my-feed/npm/registry/` |
| `-e`  | `--email`        | `string`  | Email written to `.npmrc`. Defaults to a placeholder (Azure DevOps doesn't use the value)    |
| `-d`  | `--daysToExpiry` | `number`  | Token lifetime in days (positive integer). Omit to let Azure DevOps choose                   |
| `-t`  | `--pat`          | `string`  | Supply a PAT directly instead of acquiring one from the Azure CLI                            |
| `-w`  | `--what-if`      | `boolean` | Print what would be written to `~/.npmrc` without actually writing it                        |
| `-x`  | `--force`        | `boolean` | Write `~/.npmrc` even when running in a CI environment                                       |
| `-h`  | `--help`         | `boolean` | Show help                                                                                    |
| `-v`  | `--version`      | `boolean` | Show version                                                                                 |

### Environment variables

Environment variables take precedence over global config but are overridden by CLI flags.

| Variable                     | Equivalent flag  | Notes                                                                                        |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `AZDO_NPM_AUTH_PAT`          | `--pat`          | **Prefer this over `--pat`** — CLI args appear in `ps aux` and shell history; env vars don't |
| `AZDO_NPM_AUTH_ORGANIZATION` | `--organization` |                                                                                              |
| `AZDO_NPM_AUTH_PROJECT`      | `--project`      |                                                                                              |
| `AZDO_NPM_AUTH_FEED`         | `--feed`         |                                                                                              |
| `AZDO_NPM_AUTH_REGISTRY`     | `--registry`     |                                                                                              |

---

## Troubleshooting

### `E401` — invalid authentication token

```
npm error code E401
npm error Unable to authenticate, your authentication token seems to be invalid.
```

Your `~/.npmrc` has no credentials for this feed, or the entry is malformed. Run `azpass`.

### `E401` — incorrect or missing password

```
npm error code E401
npm error Incorrect or missing password.
```

Your token has expired. Run `azpass`. Use `--daysToExpiry 90` (or save it via `azpass config set daysToExpiry 90`) to make the next expiry predictable.

### Azure CLI auth error

```
Azure CLI authentication required. Please run:

  az login

Then try azpass again.
```

Your Azure CLI session has expired. Run `az login` and then retry.

---

## Programmatic use

`azpass` exports its core functions as a typed library:

```typescript
import {
	createPat,
	createUserNpmrc,
	mergeNpmrc,
	parseAuthStatus,
	projectNpmrcMake,
	projectNpmrcParse,
	projectNpmrcRegistry,
	readConfig,
	stripAuthBlocks,
	writeConfig,
	writeNpmrc,
} from "azpass";
```

All exports are fully typed. See `src/` for the complete API surface.
