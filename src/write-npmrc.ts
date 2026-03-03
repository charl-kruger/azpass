import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { fallbackLogger, type Logger } from "./shared/cli/logger.js";
import { readFileSafe } from "./shared/read-file-safe.js";

/**
 * Merges new auth content into existing .npmrc content.
 * Existing auth blocks are replaced; all other content is preserved.
 */
export function mergeNpmrc(
	existingContent: string,
	newAuthContent: string,
): string {
	const stripped = stripAuthBlocks(existingContent);
	return stripped ? `${stripped}\n\n${newAuthContent}` : newAuthContent;
}

/**
 * Strips all azpass auth blocks from an .npmrc content string.
 * Auth blocks are delimited by `; begin auth token` and `; end auth token`.
 */
export function stripAuthBlocks(content: string): string {
	return content
		.replace(/^; begin auth token[\s\S]*?; end auth token\r?\n?/gm, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export async function writeNpmrc({
	npmrc,
	logger = fallbackLogger,
}: {
	npmrc: string;
	logger?: Logger;
}): Promise<void> {
	const homeDirectory = os.homedir();
	const userNpmrcPath = path.join(homeDirectory, ".npmrc");

	logger.info(`Writing user .npmrc to: ${userNpmrcPath}`);

	const existingContent = await readFileSafe(userNpmrcPath, "");
	const mergedContent = mergeNpmrc(existingContent, npmrc);

	try {
		await fs.writeFile(userNpmrcPath, mergedContent);
	} catch (error) {
		const errorMessage = `Error writing user .npmrc to ${userNpmrcPath}: ${error instanceof Error ? error.message : ""}`;
		throw new Error(errorMessage, { cause: error });
	}
}
