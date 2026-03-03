import { describe, expect, it, vi } from "vitest";

import { writeConfig } from "./write-config.js";

const mockMkdir = vi.fn();
const mockWriteFile = vi.fn();

vi.mock("node:fs/promises", () => ({
	get mkdir() {
		return mockMkdir;
	},
	get writeFile() {
		return mockWriteFile;
	},
}));

vi.mock("node:os", () => ({
	default: {
		homedir: () => "/home/testuser",
	},
}));

vi.mock("../shared/read-file-safe.js", () => ({
	readFileSafe: vi.fn().mockResolvedValue(""),
}));

describe("writeConfig", () => {
	it("creates the config directory and writes the config file", async () => {
		mockMkdir.mockResolvedValue(undefined);
		mockWriteFile.mockResolvedValue(undefined);

		await writeConfig({ daysToExpiry: 90, email: "dev@company.com" });

		expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("azpass"), {
			recursive: true,
		});
		expect(mockWriteFile).toHaveBeenCalledWith(
			expect.stringContaining("config.json"),
			expect.stringContaining('"daysToExpiry": 90'),
		);
		expect(mockWriteFile).toHaveBeenCalledWith(
			expect.stringContaining("config.json"),
			expect.stringContaining('"email": "dev@company.com"'),
		);
	});

	it("writes an empty config for an empty object", async () => {
		mockMkdir.mockResolvedValue(undefined);
		mockWriteFile.mockResolvedValue(undefined);

		await writeConfig({});

		expect(mockWriteFile).toHaveBeenCalledWith(
			expect.stringContaining("config.json"),
			"{}\n",
		);
	});
});
