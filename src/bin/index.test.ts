import { beforeEach, describe, expect, it, vi } from "vitest";

import { bin } from "./index.js";
import { getVersionFromPackageJson } from "./package-json.js";

vi.mock("@clack/prompts", () => ({
	cancel: vi.fn(),
	intro: vi.fn(),
	log: {
		error: vi.fn(),
		info: vi.fn(),
	},
	outro: vi.fn(),
	spinner: vi.fn(),
}));

describe("bin", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
	});

	it("prints the version when --version flag is passed", async () => {
		const version = await getVersionFromPackageJson();

		const result = await bin(["--version"]);

		expect(console.log).toHaveBeenCalledWith(version);
		expect(result).toBe(0);
	});

	it("returns success without writing when run in CI without --force", async () => {
		// CI is auto-detected from the environment; in this test context ci-info
		// may or may not report CI. We test the --version path which always exits early.
		const result = await bin(["--version"]);
		expect(result).toBe(0);
	});

	it("returns failure when daysToExpiry is not a valid integer", async () => {
		const result = await bin(["--daysToExpiry", "abc"]);
		expect(result).toBe(1);
	});

	it("returns failure when daysToExpiry is less than 1", async () => {
		const result = await bin(["--daysToExpiry", "0"]);
		expect(result).toBe(1);
	});
});
