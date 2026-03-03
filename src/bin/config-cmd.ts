import * as prompts from "@clack/prompts";
import pc from "picocolors";

import {
	configKeys,
	configSchema,
	type Config,
	type ConfigKey,
} from "../config/config-schema.js";
import { readConfig } from "../config/read-config.js";
import { writeConfig } from "../config/write-config.js";
import { StatusCodes, type StatusCode } from "../shared/codes.js";

export async function handleConfigCmd(args: string[]): Promise<StatusCode> {
	const subcommand = args[0];

	if (subcommand === "list") {
		return handleList();
	}

	if (subcommand === "get") {
		const key = args[1];
		if (!key) {
			prompts.log.error("Usage: azpass config get <key>");
			return StatusCodes.Failure;
		}
		return handleGet(key);
	}

	if (subcommand === "set") {
		const key = args[1];
		const value = args[2];
		if (!key || args.length < 3) {
			prompts.log.error("Usage: azpass config set <key> <value>");
			return StatusCodes.Failure;
		}
		return handleSet(key, value);
	}

	prompts.log.error(
		`Unknown config subcommand: ${subcommand}. Use list, get, or set.`,
	);
	return StatusCodes.Failure;
}

function isConfigKey(key: string): key is ConfigKey {
	return (configKeys as readonly string[]).includes(key);
}

async function handleList(): Promise<StatusCode> {
	const config = await readConfig();
	const entries = Object.entries(config);

	if (entries.length === 0) {
		prompts.log.info("No config values set.");
	} else {
		const lines = entries
			.map(([k, v]) => `  ${pc.cyan(k)} = ${pc.green(String(v))}`)
			.join("\n");
		prompts.log.info(`Global config (~/.config/azpass/config.json):\n${lines}`);
	}

	return StatusCodes.Success;
}

async function handleGet(key: string): Promise<StatusCode> {
	if (!isConfigKey(key)) {
		prompts.log.error(
			`Unknown config key: ${key}. Valid keys: ${configKeys.join(", ")}`,
		);
		return StatusCodes.Failure;
	}

	const config = await readConfig();
	const value = config[key];

	if (value === undefined) {
		prompts.log.info(`${key} is not set`);
	} else {
		prompts.log.info(`${key} = ${String(value)}`);
	}

	return StatusCodes.Success;
}

async function handleSet(key: string, value: string): Promise<StatusCode> {
	if (!isConfigKey(key)) {
		prompts.log.error(
			`Unknown config key: ${key}. Valid keys: ${configKeys.join(", ")}`,
		);
		return StatusCodes.Failure;
	}

	const config = await readConfig();

	let parsed: Config[ConfigKey];
	if (key === "daysToExpiry") {
		const num = Number(value);
		parsed = num;
	} else {
		parsed = value;
	}

	const updated: Config = { ...config, [key]: parsed };
	const validation = configSchema.safeParse(updated);

	if (!validation.success) {
		prompts.log.error(`Invalid value for ${key}: ${validation.error.message}`);
		return StatusCodes.Failure;
	}

	await writeConfig(validation.data);
	prompts.log.info(`Set ${pc.cyan(key)} = ${pc.green(value)}`);

	return StatusCodes.Success;
}
