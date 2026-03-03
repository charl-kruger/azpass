import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleConfigCmd } from "./config-cmd.js";

const mockReadConfig = vi.fn();
const mockWriteConfig = vi.fn();

vi.mock("../config/read-config.js", () => ({
	get readConfig() {
		return mockReadConfig;
	},
}));

vi.mock("../config/write-config.js", () => ({
	get writeConfig() {
		return mockWriteConfig;
	},
}));

vi.mock("@clack/prompts", () => ({
	log: {
		info: vi.fn(),
		error: vi.fn(),
	},
}));

import * as prompts from "@clack/prompts";

describe("handleConfigCmd", () => {
	beforeEach(() => {
		mockReadConfig.mockResolvedValue({});
		mockWriteConfig.mockResolvedValue(undefined);
		vi.mocked(prompts.log.info).mockClear();
		vi.mocked(prompts.log.error).mockClear();
	});

	describe("list", () => {
		it("reports no values when config is empty", async () => {
			mockReadConfig.mockResolvedValue({});
			await handleConfigCmd(["list"]);
			expect(prompts.log.info).toHaveBeenCalledWith(
				expect.stringContaining("No config values set"),
			);
		});

		it("shows all saved values", async () => {
			mockReadConfig.mockResolvedValue({
				daysToExpiry: 90,
				email: "dev@co.com",
			});
			await handleConfigCmd(["list"]);
			expect(prompts.log.info).toHaveBeenCalledWith(
				expect.stringContaining("daysToExpiry"),
			);
			expect(prompts.log.info).toHaveBeenCalledWith(
				expect.stringContaining("email"),
			);
		});

		it("returns success", async () => {
			const result = await handleConfigCmd(["list"]);
			expect(result).toBe(0);
		});
	});

	describe("get", () => {
		it("returns failure when no key is provided", async () => {
			const result = await handleConfigCmd(["get"]);
			expect(result).toBe(1);
		});

		it("returns failure for an unknown key", async () => {
			const result = await handleConfigCmd(["get", "unknownKey"]);
			expect(result).toBe(1);
			expect(prompts.log.error).toHaveBeenCalledWith(
				expect.stringContaining("Unknown config key"),
			);
		});

		it("shows 'not set' when key has no value", async () => {
			mockReadConfig.mockResolvedValue({});
			await handleConfigCmd(["get", "daysToExpiry"]);
			expect(prompts.log.info).toHaveBeenCalledWith(
				expect.stringContaining("not set"),
			);
		});

		it("shows the value when key is set", async () => {
			mockReadConfig.mockResolvedValue({ daysToExpiry: 90 });
			await handleConfigCmd(["get", "daysToExpiry"]);
			expect(prompts.log.info).toHaveBeenCalledWith(
				expect.stringContaining("90"),
			);
		});

		it("returns success for a valid key", async () => {
			mockReadConfig.mockResolvedValue({});
			const result = await handleConfigCmd(["get", "email"]);
			expect(result).toBe(0);
		});
	});

	describe("set", () => {
		it("returns failure when key is missing", async () => {
			const result = await handleConfigCmd(["set"]);
			expect(result).toBe(1);
		});

		it("returns failure when value is missing", async () => {
			const result = await handleConfigCmd(["set", "email"]);
			expect(result).toBe(1);
		});

		it("returns failure for an unknown key", async () => {
			const result = await handleConfigCmd(["set", "badKey", "value"]);
			expect(result).toBe(1);
			expect(prompts.log.error).toHaveBeenCalledWith(
				expect.stringContaining("Unknown config key"),
			);
		});

		it("saves a string value", async () => {
			const result = await handleConfigCmd(["set", "email", "dev@co.com"]);
			expect(result).toBe(0);
			expect(mockWriteConfig).toHaveBeenCalledWith(
				expect.objectContaining({ email: "dev@co.com" }),
			);
		});

		it("saves daysToExpiry as a number", async () => {
			const result = await handleConfigCmd(["set", "daysToExpiry", "90"]);
			expect(result).toBe(0);
			expect(mockWriteConfig).toHaveBeenCalledWith(
				expect.objectContaining({ daysToExpiry: 90 }),
			);
		});

		it("returns failure when daysToExpiry value is invalid", async () => {
			const result = await handleConfigCmd(["set", "daysToExpiry", "0"]);
			expect(result).toBe(1);
			expect(prompts.log.error).toHaveBeenCalledWith(
				expect.stringContaining("Invalid value"),
			);
		});
	});

	it("returns failure for an unknown subcommand", async () => {
		const result = await handleConfigCmd(["unknown"]);
		expect(result).toBe(1);
	});
});
