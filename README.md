<p align="center"><img alt="azpass logo" src="azpass-logo-small.png" /></p>

<h1 align="center">azpass</h1>

<p align="center">
	<a href="https://github.com/charl-kruger/azpass/actions/workflows/release.yml" target="_blank"><img alt="Release status" src="https://github.com/charl-kruger/azpass/actions/workflows/release.yml/badge.svg" /></a>
	<a href="https://github.com/charl-kruger/azpass/blob/main/.github/CODE_OF_CONDUCT.md" target="_blank"><img alt="🤝 Code of Conduct: Kept" src="https://img.shields.io/badge/%F0%9F%A4%9D_code_of_conduct-kept-21bb42" /></a>
	<a href="https://github.com/charl-kruger/azpass/blob/main/LICENSE.md" target="_blank"><img alt="📝 License: MIT" src="https://img.shields.io/badge/%F0%9F%93%9D_license-MIT-21bb42.svg"></a>
	<a href="http://npmjs.com/package/azpass"><img alt="npm version" src="https://img.shields.io/npm/v/azpass?color=21bb42&label=%F0%9F%93%A6%20npm" /></a>
	<img alt="TypeScript: Strict" src="https://img.shields.io/badge/%F0%9F%92%AA_typescript-strict-21bb42.svg" />
</p>

<p align="center"><strong>One command to authenticate your machine with Azure DevOps npm feeds — on any OS.</strong></p>

---

## The fix you're looking for

If `npm install` just failed with `E401`, run this:

```shell
npx -y --registry https://registry.npmjs.org azpass
```

That's it. If it worked, you can stop reading. If you want to understand what just happened — or if you're setting this up for a team — read on.

> **Why `--registry https://registry.npmjs.org`?**
> Your project's `.npmrc` points npm at your private Azure DevOps feed. Without this flag, `npx` tries to download `azpass` _from that private feed_ — and fails, because you aren't authenticated yet. The flag tells npx to fetch the package from the public registry instead.

---

## What this tool does

Azure DevOps lets teams publish private npm packages. Consuming them requires a Personal Access Token (PAT) written to your `~/.npmrc` in a specific base64-encoded format. Doing this manually involves navigating Azure DevOps settings, generating a token, base64-encoding it, and hand-editing a file — every time the token expires.

`azpass` automates all of that. It uses your existing Azure CLI login to request a PAT on your behalf and writes the correctly formatted credentials to `~/.npmrc`. On every run it performs a **safe merge** — your other registry settings and preferences are never touched.

Windows users have always had [`vsts-npm-auth`](https://www.npmjs.com/package/vsts-npm-auth) to do this automatically. This tool brings the same experience to macOS and Linux.

---

## Prerequisites

`azpass` acquires a token using the Azure CLI. You'll need:

1. **Azure CLI installed** — [installation guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Logged in** — run `az login` if you haven't already
3. **Your Azure DevOps organization connected to Microsoft Entra ID** — [how to connect](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/connect-organization-to-azure-ad?view=azure-devops)

Already have a PAT and don't want to involve the Azure CLI? Pass it directly with `--pat` or the `AZDO_NPM_AUTH_PAT` environment variable.

---

## Three ways to invoke

### 1. `parse` mode (default — no arguments needed)

Reads your project `.npmrc`, extracts the Azure DevOps registry URL, and sets up auth automatically.

```shell
npx -y --registry https://registry.npmjs.org azpass
```

Use this when your project already has a `.npmrc` file pointing at an Azure DevOps feed. This is the right choice for 95% of situations.

### 2. `registry` mode — supply the full URL

Skips reading the project `.npmrc` and uses the URL you give it directly.

```shell
npx -y --registry https://registry.npmjs.org azpass \
	--registry https://pkgs.dev.azure.com/my-org/_packaging/my-feed/npm/registry/
```

Note the two `--registry` values: the first is the _npm_ registry for fetching `azpass` itself; the second is the _Azure DevOps_ feed you want to authenticate against.

### 3. `make` mode — specify org, project, and feed

Constructs the registry URL from its components. Useful in scripting contexts where you know the parts but not the assembled URL.

**Organization-scoped feed:**

```shell
npx -y --registry https://registry.npmjs.org azpass \
	--organization my-org \
	--feed my-feed
```

**Project-scoped feed:**

```shell
npx -y --registry https://registry.npmjs.org azpass \
	--organization my-org \
	--project my-project \
	--feed my-feed
```

---

## Setting up for your whole team

The best experience is a one-word command that everyone on your team can run whenever they hit an auth error. Add this to your `package.json`:

```json
"scripts": {
  "auth": "npx -y --registry https://registry.npmjs.org azpass"
}
```

Then your onboarding instruction becomes:

> Got an `E401` error? Run `npm run auth`.

### Why not `preinstall`?

A `preinstall` script that runs `azpass` without arguments will fail — npm reads the project `.npmrc` before running `preinstall`, and immediately hits the auth error it was supposed to prevent.

There is one way to make it work: put the `.npmrc` in a _nested_ directory and point the script at it:

```json
"scripts": {
  "preinstall": "npx --yes azpass --config ./subdir/.npmrc"
}
```

This requires a more complex repo structure. Unless you already have that, stick with the `auth` script approach above.

---

## CI environments

`azpass` automatically detects CI environments (GitHub Actions, Azure Pipelines, CircleCI, and [40+ others](https://github.com/watson/ci-info#supported-ci-tools)) and exits without writing anything. CI pipelines have their own, more appropriate auth mechanisms.

If you have a specific case where you genuinely need to write `~/.npmrc` during a CI run, use `--force`:

```shell
azpass --force
```

---

## How `~/.npmrc` is handled

`azpass` never replaces your `~/.npmrc`. On each run it:

1. Reads your existing `~/.npmrc`
2. Removes only the `; begin auth token … ; end auth token` blocks it previously wrote
3. Appends the freshly generated credentials

Everything else in your `~/.npmrc` — other registries, `engine-strict`, editor settings — is preserved exactly as you left it.

---

## Reference

### Options

| Short | Long             | Type      | Description                                                                                        |
| ----- | ---------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `-c`  | `--config`       | `string`  | Path to the project `.npmrc` to read. Defaults to `.npmrc` in the current directory                |
| `-o`  | `--organization` | `string`  | Azure DevOps organization name                                                                     |
| `-p`  | `--project`      | `string`  | Azure DevOps project name (only required for project-scoped feeds)                                 |
| `-f`  | `--feed`         | `string`  | Azure Artifacts feed name                                                                          |
| `-r`  | `--registry`     | `string`  | Full registry URL, e.g. `https://pkgs.dev.azure.com/my-org/_packaging/my-feed/npm/registry/`       |
| `-e`  | `--email`        | `string`  | Email written to `.npmrc`. Defaults to a placeholder (Azure DevOps doesn't actually use the value) |
| `-d`  | `--daysToExpiry` | `number`  | Token lifetime in days (positive integer). Omit to let Azure DevOps choose                         |
| `-t`  | `--pat`          | `string`  | Supply a PAT directly instead of acquiring one from the Azure CLI                                  |
| `-w`  | `--what-if`      | `boolean` | Print what would be written to `~/.npmrc` without actually writing it                              |
| `-x`  | `--force`        | `boolean` | Write `~/.npmrc` even when running in a CI environment                                             |
| `-h`  | `--help`         | `boolean` | Show help                                                                                          |
| `-v`  | `--version`      | `boolean` | Show version                                                                                       |

### Environment variables

CLI flags take precedence over environment variables.

| Variable                     | Equivalent flag  | Notes                                                                                        |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `AZDO_NPM_AUTH_PAT`          | `--pat`          | **Prefer this over `--pat`** — CLI args appear in `ps aux` and shell history; env vars don't |
| `AZDO_NPM_AUTH_ORGANIZATION` | `--organization` |                                                                                              |
| `AZDO_NPM_AUTH_PROJECT`      | `--project`      |                                                                                              |
| `AZDO_NPM_AUTH_FEED`         | `--feed`         |                                                                                              |
| `AZDO_NPM_AUTH_REGISTRY`     | `--registry`     |                                                                                              |

Example — authenticate using a pre-existing PAT without exposing it in shell history:

```shell
AZDO_NPM_AUTH_PAT=my-secret-token npx -y --registry https://registry.npmjs.org azpass
```

---

## Troubleshooting `E401`

Every `E401` from Azure DevOps npm feeds has the same remedy:

```shell
npx -y --registry https://registry.npmjs.org azpass
```

Here are the two most common error messages and what they mean.

### "Unable to authenticate, your authentication token seems to be invalid"

```
npm error code E401
npm error Unable to authenticate, your authentication token seems to be invalid.
npm error To correct this please try logging in again with:
npm error npm login
```

Your `~/.npmrc` has no credentials for this feed, or the entry is malformed. Run `azpass` to create one.

### "Incorrect or missing password"

```
npm error code E401
npm error Incorrect or missing password.
```

Your token has expired. Run `azpass` to generate a fresh one. Consider passing `--daysToExpiry 90` (or any value that suits your security policy) so the next expiry is predictable.

---

## Programmatic use

`azpass` exports its core functions as a typed library for use in your own tooling:

```typescript
import {
	createPat,
	createUserNpmrc,
	mergeNpmrc,
	projectNpmrcMake,
	projectNpmrcParse,
	projectNpmrcRegistry,
	stripAuthBlocks,
	writeNpmrc,
} from "azpass";
```

All exports are fully typed. See the source in `src/` for the complete API surface.
