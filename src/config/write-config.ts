import * as fs from "node:fs/promises";
import path from "node:path";

import { type Config } from "./config-schema.js";
import { getConfigPath } from "./read-config.js";

export async function writeConfig(config: Config): Promise<void> {
	const configPath = getConfigPath();
	const configDir = path.dirname(configPath);

	await fs.mkdir(configDir, { recursive: true });
	await fs.writeFile(configPath, JSON.stringify(config, null, 2) + "\n");
}
