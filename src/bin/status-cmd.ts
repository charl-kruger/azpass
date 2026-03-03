import * as prompts from "@clack/prompts";
import os from "node:os";
import path from "node:path";
import pc from "picocolors";

import { parseAuthStatus } from "../parse-auth-status.js";
import { readFileSafe } from "../shared/read-file-safe.js";
import { StatusCodes, type StatusCode } from "../shared/codes.js";

export async function handleStatusCmd(): Promise<StatusCode> {
	const npmrcPath = path.join(os.homedir(), ".npmrc");
	const content = await readFileSafe(npmrcPath, "");

	if (!content) {
		prompts.log.info("No ~/.npmrc found or it is empty.");
		return StatusCodes.Success;
	}

	const entries = parseAuthStatus(content);

	if (entries.length === 0) {
		prompts.log.info("No authenticated Azure DevOps feeds found in ~/.npmrc.");
		return StatusCodes.Success;
	}

	const now = new Date();
	const WARN_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

	let hasExpired = false;
	const lines: string[] = ["", "  Authenticated feeds in ~/.npmrc:", ""];

	for (const entry of entries) {
		let symbol: string;
		let label: string;

		if (!entry.expiresAt) {
			symbol = pc.gray("○");
			label = pc.gray(`${entry.registry}  no expiry info`);
		} else {
			const msUntilExpiry = entry.expiresAt.getTime() - now.getTime();
			const daysUntilExpiry = Math.floor(msUntilExpiry / (24 * 60 * 60 * 1000));
			const expiryDateStr = formatDate(entry.expiresAt);

			if (msUntilExpiry <= 0) {
				hasExpired = true;
				symbol = pc.red("✗");
				label = pc.red(`${entry.registry}  expired ${expiryDateStr}`);
			} else if (msUntilExpiry <= WARN_THRESHOLD_MS) {
				symbol = pc.yellow("⚠");
				label = pc.yellow(
					`${entry.registry}  valid until ${expiryDateStr}  (in ${String(daysUntilExpiry)} day${daysUntilExpiry === 1 ? "" : "s"})`,
				);
			} else {
				symbol = pc.green("✓");
				label = pc.green(
					`${entry.registry}  valid until ${expiryDateStr}  (in ${String(daysUntilExpiry)} days)`,
				);
			}
		}

		lines.push(`  ${symbol}  ${label}`);
	}

	lines.push("");
	prompts.log.info(lines.join("\n"));

	return hasExpired ? StatusCodes.Failure : StatusCodes.Success;
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
