import { describe, expect, it } from "vitest";

import { projectNpmrcRegistry } from "./project-npmrc-registry.js";

describe("projectNpmrcRegistry", () => {
	it("outputs the expected structure on successful parse", () => {
		const result = projectNpmrcRegistry({
			registry:
				"https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		});
		expect(result).toEqual({
			organization: "charlkruger",
			urlWithoutRegistryAtEnd:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/",
			urlWithoutRegistryAtStart:
				"//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/",
		});
	});

	it("errors on invalid content", () => {
		expect(() =>
			projectNpmrcRegistry({
				registry: "stuff",
			}),
		).toThrowError("Unable to extract information");
	});
});
