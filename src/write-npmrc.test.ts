import { describe, expect, it, vi } from "vitest";

import { mergeNpmrc, stripAuthBlocks, writeNpmrc } from "./write-npmrc.js";

const mockReadFileSafe = vi.fn();

vi.mock("./shared/read-file-safe.js", () => ({
	get readFileSafe() {
		return mockReadFileSafe;
	},
}));

const mockWriteFile = vi.fn();

vi.mock("node:fs/promises", () => ({
	get writeFile() {
		return mockWriteFile;
	},
}));

vi.mock("node:os", () => ({
	default: {
		homedir: () => "/home/testuser",
	},
}));

describe("stripAuthBlocks", () => {
	it("returns empty string when content is only an auth block", () => {
		const content = `; begin auth token
//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		expect(stripAuthBlocks(content)).toBe("");
	});

	it("preserves content before and after an auth block", () => {
		const content = `always-auth=true

; begin auth token
//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=abc
; end auth token

engine-strict=true`;
		expect(stripAuthBlocks(content)).toBe(
			"always-auth=true\n\nengine-strict=true",
		);
	});

	it("strips multiple auth blocks", () => {
		const content = `; begin auth token
//pkgs.dev.azure.com/org1/_packaging/feed1/npm/registry/:_password=abc
; end auth token

; begin auth token
//pkgs.dev.azure.com/org2/_packaging/feed2/npm/registry/:_password=def
; end auth token
`;
		expect(stripAuthBlocks(content)).toBe("");
	});

	it("returns unchanged content when no auth blocks exist", () => {
		const content = `always-auth=true\nengine-strict=true`;
		expect(stripAuthBlocks(content)).toBe(
			"always-auth=true\nengine-strict=true",
		);
	});

	it("handles empty content", () => {
		expect(stripAuthBlocks("")).toBe("");
	});
});

describe("mergeNpmrc", () => {
	it("returns just the new auth content when there is no existing content", () => {
		const newAuth = `; begin auth token\n//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=abc\n; end auth token\n`;
		expect(mergeNpmrc("", newAuth)).toBe(newAuth);
	});

	it("replaces an existing auth block, preserving other content", () => {
		const existing = `always-auth=true

; begin auth token
//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=OLD
; end auth token
`;
		const newAuth = `; begin auth token\n//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=NEW\n; end auth token\n`;
		const result = mergeNpmrc(existing, newAuth);
		expect(result).toContain("always-auth=true");
		expect(result).toContain("_password=NEW");
		expect(result).not.toContain("_password=OLD");
	});

	it("appends new auth content to existing non-auth content", () => {
		const existing = `always-auth=true`;
		const newAuth = `; begin auth token\n//pkgs.dev.azure.com/org/_packaging/feed/npm/:_password=abc\n; end auth token\n`;
		const result = mergeNpmrc(existing, newAuth);
		expect(result).toBe(`always-auth=true\n\n${newAuth}`);
	});
});

describe("writeNpmrc", () => {
	it("merges new auth content with existing ~/.npmrc", async () => {
		const existingContent = `always-auth=true

; begin auth token
//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=OLD
; end auth token
`;
		const newAuth = `; begin auth token\n//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=NEW\n; end auth token\n`;

		mockReadFileSafe.mockResolvedValue(existingContent);
		mockWriteFile.mockResolvedValue(undefined);

		await writeNpmrc({ npmrc: newAuth });

		expect(mockWriteFile).toHaveBeenCalledWith(
			"/home/testuser/.npmrc",
			expect.stringContaining("always-auth=true"),
		);
		expect(mockWriteFile).toHaveBeenCalledWith(
			"/home/testuser/.npmrc",
			expect.stringContaining("_password=NEW"),
		);
		const writtenContent: string = mockWriteFile.mock.calls[0][1] as string;
		expect(writtenContent).not.toContain("_password=OLD");
	});

	it("writes new auth content when ~/.npmrc does not exist", async () => {
		mockReadFileSafe.mockResolvedValue("");
		mockWriteFile.mockResolvedValue(undefined);

		const newAuth = `; begin auth token\n//pkgs.dev.azure.com/org/_packaging/feed/npm/registry/:_password=abc\n; end auth token\n`;
		await writeNpmrc({ npmrc: newAuth });

		expect(mockWriteFile).toHaveBeenCalledWith(
			"/home/testuser/.npmrc",
			newAuth,
		);
	});

	it("throws a descriptive error when writeFile fails", async () => {
		mockReadFileSafe.mockResolvedValue("");
		mockWriteFile.mockRejectedValue(new Error("EACCES: permission denied"));

		await expect(() => writeNpmrc({ npmrc: "content" })).rejects.toThrow(
			"Error writing user .npmrc to /home/testuser/.npmrc: EACCES: permission denied",
		);
	});
});
