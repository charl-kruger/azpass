import pc from "picocolors";
import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";

import { outro } from "./outro.js";

const mockOutro = vi.fn();

vi.mock("@clack/prompts", () => ({
	get outro() {
		return mockOutro;
	},
}));

let mockConsoleLog: MockInstance;

describe("outro", () => {
	beforeEach(() => {
		mockConsoleLog = vi
			.spyOn(console, "log")
			.mockImplementation(() => undefined);
	});

	it("logs only basic statements when no lines are provided", () => {
		outro([{ label: "Abc 123" }]);

		expect(mockConsoleLog.mock.calls).toEqual([
			[pc.blue("Abc 123")],
			[],
			[pc.green(`See ya! 👋`)],
			[],
		]);
	});

	it("also logs lines when provided", () => {
		outro([{ label: "Abc 123", lines: ["one", "two"] }]);

		expect(mockConsoleLog.mock.calls).toEqual([
			[pc.blue("Abc 123")],
			[],
			["one"],
			["two"],
			[],
			[pc.green(`See ya! 👋`)],
			[],
		]);
	});

	it("logs lines as code when variant is specified", () => {
		outro([{ label: "Abc 123", lines: ["one", "two"], variant: "code" }]);

		expect(mockConsoleLog.mock.calls).toEqual([
			[pc.blue("Abc 123")],
			[],
			[pc.gray("one")],
			[pc.gray("two")],
			[],
			[pc.green(`See ya! 👋`)],
			[],
		]);
	});
});
