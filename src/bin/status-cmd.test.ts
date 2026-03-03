import { describe, expect, it, vi } from "vitest";

import { handleStatusCmd } from "./status-cmd.js";

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

vi.mock("@clack/prompts", () => ({
	log: {
		info: vi.fn(),
		error: vi.fn(),
	},
}));

import * as prompts from "@clack/prompts";

describe("handleStatusCmd", () => {
	it("reports no file when ~/.npmrc does not exist", async () => {
		mockReadFileSafe.mockResolvedValue("");
		const result = await handleStatusCmd();
		expect(result).toBe(0);
		expect(prompts.log.info).toHaveBeenCalledWith(
			expect.stringContaining("No ~/.npmrc"),
		);
	});

	it("reports no feeds when no auth blocks are present", async () => {
		mockReadFileSafe.mockResolvedValue("always-auth=true\n");
		const result = await handleStatusCmd();
		expect(result).toBe(0);
		expect(prompts.log.info).toHaveBeenCalledWith(
			expect.stringContaining("No authenticated Azure DevOps feeds"),
		);
	});

	it("returns success when all tokens are valid with plenty of time remaining", async () => {
		const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
		const content = `; begin auth token
; expires: ${futureDate.toISOString()}
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		mockReadFileSafe.mockResolvedValue(content);
		const result = await handleStatusCmd();
		expect(result).toBe(0);
	});

	it("returns failure when a token is expired", async () => {
		const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const content = `; begin auth token
; expires: ${pastDate.toISOString()}
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		mockReadFileSafe.mockResolvedValue(content);
		const result = await handleStatusCmd();
		expect(result).toBe(1);
	});

	it("returns success when a token has no expiry info", async () => {
		const content = `; begin auth token
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		mockReadFileSafe.mockResolvedValue(content);
		const result = await handleStatusCmd();
		expect(result).toBe(0);
	});

	it("shows registry info in the output", async () => {
		const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
		const content = `; begin auth token
; expires: ${futureDate.toISOString()}
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		mockReadFileSafe.mockResolvedValue(content);
		await handleStatusCmd();
		expect(prompts.log.info).toHaveBeenCalledWith(
			expect.stringContaining("my-org"),
		);
	});
});
