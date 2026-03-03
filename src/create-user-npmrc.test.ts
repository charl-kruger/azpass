import { describe, expect, it } from "vitest";

import type { ParsedProjectNpmrc } from "./types.js";

import { createUserNpmrc } from "./create-user-npmrc.js";

describe("createUserNpmrc", () => {
	it("creates a properly formatted user .npmrc with organization feed", () => {
		// Arrange
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			scope: undefined,
			fullRegistryMatch: undefined,
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		};
		const pat = "test-pat-token";

		// Act
		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat,
		});

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"; begin auth token
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:email=npm requires email to be set but doesn't use the value
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:email=npm requires email to be set but doesn't use the value
			; end auth token
			"
		`);
	});

	it("creates a user .npmrc with project-specific feed", () => {
		// Arrange
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			scope: undefined,
			fullRegistryMatch: undefined,
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/registry/",
		};
		const pat = "test-pat-token";

		// Act
		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat,
		});

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"; begin auth token
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/registry/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/registry/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/registry/:email=npm requires email to be set but doesn't use the value
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/azure-static-web-apps/_packaging/npmrc-script-demo/npm/:email=npm requires email to be set but doesn't use the value
			; end auth token
			"
		`);
	});

	it("uses custom email when provided", () => {
		// Arrange
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			scope: undefined,
			fullRegistryMatch: undefined,
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		};
		const pat = "test-pat-token";
		const customEmail = "test@example.com";

		// Act
		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat,
			email: customEmail,
		});

		// Assert
		expect(result).toMatchInlineSnapshot(`
			"; begin auth token
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:email=test@example.com
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:username=charlkruger
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:_password=dGVzdC1wYXQtdG9rZW4=
			//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:email=test@example.com
			; end auth token
			"
		`);
	});

	it("includes expires comment when validTo is provided", () => {
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			scope: undefined,
			fullRegistryMatch: undefined,
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		};

		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat: "test-pat-token",
			validTo: "2026-06-01T00:00:00.000Z",
		});

		expect(result).toContain("; expires: 2026-06-01T00:00:00.000Z");
	});

	it("omits expires comment when validTo is not provided", () => {
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			scope: undefined,
			fullRegistryMatch: undefined,
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		};

		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat: "test-pat-token",
		});

		expect(result).not.toContain("; expires:");
	});

	it("handles parsed project npmrc with a scope property", () => {
		// Arrange
		const parsedProjectNpmrc: ParsedProjectNpmrc = {
			organization: "charlkruger",
			scope: "@myorg",
			fullRegistryMatch:
				"@myorg:registry=https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		};
		const pat = "test-pat-token";

		// Act
		const result = createUserNpmrc({
			parsedProjectNpmrc,
			pat,
		});

		// Assert
		// Verify the scope doesn't affect the .npmrc format
		expect(result).toContain("; begin auth token");
		expect(result).toContain(
			"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:username=charlkruger",
		);
		expect(result).toContain(
			"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:username=charlkruger",
		);

		// Even though parsedProjectNpmrc has a scope property, it should not appear in the .npmrc output
		// as it's not used by the createUserNpmrc function
		const base64EncodedPAT = Buffer.from(pat).toString("base64");
		const expectedNpmrcWithScope = `; begin auth token
@myorg:registry=https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:username=charlkruger
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:_password=${base64EncodedPAT}
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:email=npm requires email to be set but doesn't use the value
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:username=charlkruger
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:_password=${base64EncodedPAT}
//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:email=npm requires email to be set but doesn't use the value
; end auth token
`;
		expect(result).toEqual(expectedNpmrcWithScope);
	});
});
