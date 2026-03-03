import { describe, expect, it } from "vitest";

import { parseAuthStatus } from "./parse-auth-status.js";

describe("parseAuthStatus", () => {
	it("returns empty array for empty content", () => {
		expect(parseAuthStatus("")).toEqual([]);
	});

	it("returns empty array when no auth blocks exist", () => {
		expect(parseAuthStatus("always-auth=true\nengine-strict=true")).toEqual([]);
	});

	it("parses a single auth block without expiry", () => {
		const content = `; begin auth token
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:username=my-org
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		const result = parseAuthStatus(content);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			organization: "my-org",
			registry: "pkgs.dev.azure.com/my-org",
			expiresAt: undefined,
		});
	});

	it("parses a single auth block with expiry", () => {
		const content = `; begin auth token
; expires: 2026-06-01T00:00:00.000Z
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:username=my-org
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		const result = parseAuthStatus(content);
		expect(result).toHaveLength(1);
		expect(result[0]?.organization).toBe("my-org");
		expect(result[0]?.expiresAt).toEqual(new Date("2026-06-01T00:00:00.000Z"));
	});

	it("parses multiple auth blocks", () => {
		const content = `; begin auth token
; expires: 2026-06-01T00:00:00.000Z
//pkgs.dev.azure.com/org-a/_packaging/feed/npm/registry/:_password=aaa
; end auth token

; begin auth token
//pkgs.dev.azure.com/org-b/_packaging/feed/npm/registry/:_password=bbb
; end auth token
`;
		const result = parseAuthStatus(content);
		expect(result).toHaveLength(2);
		expect(result[0]?.organization).toBe("org-a");
		expect(result[0]?.expiresAt).toEqual(new Date("2026-06-01T00:00:00.000Z"));
		expect(result[1]?.organization).toBe("org-b");
		expect(result[1]?.expiresAt).toBeUndefined();
	});

	it("handles an invalid expiry date gracefully", () => {
		const content = `; begin auth token
; expires: not-a-date
//pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/:_password=abc
; end auth token
`;
		const result = parseAuthStatus(content);
		expect(result[0]?.expiresAt).toBeUndefined();
	});

	it("ignores blocks without a recognizable registry URL", () => {
		const content = `; begin auth token
; expires: 2026-06-01T00:00:00.000Z
; end auth token
`;
		expect(parseAuthStatus(content)).toEqual([]);
	});
});
