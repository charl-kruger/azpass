import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";

import { logHelpText } from "./help.js";

function makeProxy<T extends object>(receiver: T): T {
	return new Proxy(receiver, {
		get: () => makeProxy((input: string) => input),
	});
}

vi.mock("picocolors", () => ({
	default: makeProxy({}),
}));

let mockConsoleLog: MockInstance;

describe("logHelpText", () => {
	beforeEach(() => {
		mockConsoleLog = vi
			.spyOn(console, "log")
			.mockImplementation(() => undefined);
	});

	it("logs help text when called", () => {
		logHelpText("1.0.0");

		expect(mockConsoleLog.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "azpass 1.0.0",
			  ],
			  [
			    "Authenticate npm to Azure DevOps private feeds",
			  ],
			  [
			    " ",
			  ],
			  [
			    "Subcommands:",
			  ],
			  [
			    "
			  azpass config list                  List all saved config values
			  azpass config get <key>             Get a saved config value
			  azpass config set <key> <value>     Save a config value (keys: daysToExpiry, email, organization, project, feed)
			  azpass status                       Show auth status for all Azure DevOps feeds in ~/.npmrc",
			  ],
			  [
			    " ",
			  ],
			  [
			    "Core options:",
			  ],
			  [
			    "
			  -h | --help: Show help",
			  ],
			  [
			    "
			  -v | --version: Show version",
			  ],
			  [],
			  [
			    " ",
			  ],
			  [
			    "Optional options:",
			  ],
			  [
			    "
			  -c | --config (string): The location of the .npmrc file. Defaults to current directory",
			  ],
			  [
			    "
			  -w | --what-if: If provided, will not write to the user .npmrc file; will instead print to stdout",
			  ],
			  [
			    "
			  -x | --force: If provided, bypasses CI environment detection and writes the user .npmrc file",
			  ],
			  [
			    "
			  -o | --organization (string): The Azure DevOps organization - only required if not parsing from the .npmrc file",
			  ],
			  [
			    "
			  -p | --project (string): The Azure DevOps project - only required if not parsing from the .npmrc file and the feed is project-scoped",
			  ],
			  [
			    "
			  -f | --feed (string): The Azure Artifacts feed - only required if not parsing from the .npmrc file",
			  ],
			  [
			    "
			  -r | --registry (string): The registry to use, eg 'https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/' - only required if not parsing from the .npmrc file",
			  ],
			  [
			    "
			  -e | --email (string): Allows users to supply an explicit email - if not supplied, the example ADO value will be used",
			  ],
			  [
			    "
			  -d | --daysToExpiry (string): Allows users to supply an explicit number of days to expiry - if not supplied, then ADO will determine the expiry date",
			  ],
			  [
			    "
			  -t | --pat (string): Allows users to supply an explicit Personal Access Token (which must include the Packaging read and write scopes) - if not supplied, will be acquired from the Azure CLI",
			  ],
			  [],
			]
		`);
	});
});
