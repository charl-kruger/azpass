import { beforeEach, describe, expect, it, vi } from "vitest";

import { readConfig, getConfigPath } from "./read-config.js";

const mockReadFileSafe = vi.fn();

vi.mock("../shared/read-file-safe.js", () => ({
	get readFileSafe() {
		return mockReadFileSafe;
	},
}));

vi.mock("node:os", () => ({
	default: {
		homedir: () => "/home/testuser",
	},
}));

describe("getConfigPath", () => {
	it("returns XDG_CONFIG_HOME path when env var is set", () => {
		process.env.XDG_CONFIG_HOME = "/custom/config";
		const result = getConfigPath();
		expect(result).toBe("/custom/config/azpass/config.json");
		delete process.env.XDG_CONFIG_HOME;
	});

	it("falls back to ~/.config when XDG_CONFIG_HOME is not set", () => {
		delete process.env.XDG_CONFIG_HOME;
		const result = getConfigPath();
		expect(result).toBe("/home/testuser/.config/azpass/config.json");
	});
});

describe("readConfig", () => {
	beforeEach(() => {
		delete process.env.XDG_CONFIG_HOME;
	});

	it("returns empty object when config file does not exist", async () => {
		mockReadFileSafe.mockResolvedValue("");
		expect(await readConfig()).toEqual({});
	});

	it("returns parsed config when file has valid content", async () => {
		mockReadFileSafe.mockResolvedValue(
			JSON.stringify({ daysToExpiry: 90, email: "dev@company.com" }),
		);
		expect(await readConfig()).toEqual({
			daysToExpiry: 90,
			email: "dev@company.com",
		});
	});

	it("returns empty object when file has invalid JSON", async () => {
		mockReadFileSafe.mockResolvedValue("not-json{{{");
		expect(await readConfig()).toEqual({});
	});

	it("returns empty object when file has unknown keys", async () => {
		mockReadFileSafe.mockResolvedValue(JSON.stringify({ unknownKey: "value" }));
		expect(await readConfig()).toEqual({});
	});

	it("returns empty object when daysToExpiry is invalid", async () => {
		mockReadFileSafe.mockResolvedValue(JSON.stringify({ daysToExpiry: -1 }));
		expect(await readConfig()).toEqual({});
	});
});
