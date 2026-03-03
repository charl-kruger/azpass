import os from "node:os";
import path from "node:path";

import { configSchema, type Config } from "./config-schema.js";
import { readFileSafe } from "../shared/read-file-safe.js";

export function getConfigPath(): string {
	const xdgConfigHome = process.env.XDG_CONFIG_HOME;
	const baseDir = xdgConfigHome ?? path.join(os.homedir(), ".config");
	return path.join(baseDir, "azpass", "config.json");
}

export async function readConfig(): Promise<Config> {
	const configPath = getConfigPath();
	const content = await readFileSafe(configPath, "");

	if (!content) {
		return {};
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return {};
	}

	const result = configSchema.safeParse(parsed);
	return result.success ? result.data : {};
}
