import * as prompts from "@clack/prompts";
import ci from "ci-info";
import pc from "picocolors";
import path from "node:path";
import { parseArgs } from "node:util";
import { fromZodError } from "zod-validation-error";

import {
	createPat,
	createUserNpmrc,
	projectNpmrcMake,
	projectNpmrcParse,
	writeNpmrc,
} from "../index.js";
import { readConfig } from "../config/read-config.js";
import { projectNpmrcRegistry } from "../project-npmrc-registry.js";
import { withSpinner } from "../shared/cli/spinners.js";
import { StatusCodes } from "../shared/codes.js";
import { options } from "../shared/options/args.js";
import { optionsSchema } from "../shared/options/options-schema.js";
import { handleConfigCmd } from "./config-cmd.js";
import { handleStatusCmd } from "./status-cmd.js";
import { logHelpText } from "./help.js";
import { getVersionFromPackageJson } from "./package-json.js";

const operationMessage = (verb: string) => `Operation ${verb}.`;

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		const cause = error.cause;
		const causeMessage =
			cause instanceof Error
				? `\n\n${getErrorMessage(cause)}`
				: typeof cause === "string"
					? `\n\n${cause}`
					: "";
		return `${error.message}${causeMessage}`;
	}
	return typeof error === "string" ? error : "An unknown error occurred";
}

export async function bin(args: string[]) {
	// Subcommand dispatch (before any parseArgs processing)
	if (args[0] === "config") return handleConfigCmd(args.slice(1));
	if (args[0] === "status") return handleStatusCmd();

	const logger = {
		info: (message = "") => {
			prompts.log.info(message);
		},
		error: (message = "") => {
			prompts.log.error(message);
		},
	};

	const version = await getVersionFromPackageJson();

	const introPrompts = `${pc.blue(` Welcome to`)} ${pc.bgCyan(pc.black(`azpass`))} ${pc.blue(`${version}!`)}`;
	const outroPrompts = `${pc.blue(` Thanks for using`)} ${pc.bgCyan(pc.black(`azpass`))} ${pc.blue(`${version}!`)}`;

	const { values } = parseArgs({
		args,
		options,
		strict: false,
	});

	if (values.help) {
		logHelpText([introPrompts]);
		return StatusCodes.Success;
	}

	if (values.version) {
		console.log(version);
		return StatusCodes.Success;
	}

	prompts.intro(introPrompts);

	const globalConfig = await readConfig();

	// Environment variables provide a more secure alternative to CLI flags,
	// since CLI args are visible in process lists (ps aux).
	// Precedence (low → high): global config → env vars → CLI flags
	const mappedOptions = {
		whatIf: values["what-if"],
		force: values.force,
		pat: values.pat ?? process.env.AZDO_NPM_AUTH_PAT,
		config: values.config,
		organization:
			values.organization ??
			process.env.AZDO_NPM_AUTH_ORGANIZATION ??
			globalConfig.organization,
		project:
			values.project ??
			process.env.AZDO_NPM_AUTH_PROJECT ??
			globalConfig.project,
		feed: values.feed ?? process.env.AZDO_NPM_AUTH_FEED ?? globalConfig.feed,
		registry: values.registry ?? process.env.AZDO_NPM_AUTH_REGISTRY,
		email: values.email ?? globalConfig.email,
		daysToExpiry:
			values.daysToExpiry !== undefined
				? Number(values.daysToExpiry)
				: globalConfig.daysToExpiry,
	};

	const optionsParseResult = optionsSchema.safeParse(mappedOptions);

	if (!optionsParseResult.success) {
		logger.error(
			pc.red(
				String(
					fromZodError(optionsParseResult.error, {
						issueSeparator: "\n    - ",
					}),
				),
			),
		);

		prompts.cancel(operationMessage("failed"));
		prompts.outro(outroPrompts);

		return StatusCodes.Failure;
	}

	const {
		whatIf,
		force,
		config,
		organization,
		project,
		feed,
		registry,
		email,
		pat,
		daysToExpiry,
	} = optionsParseResult.data;

	if (ci.isCI && !force) {
		logger.error(
			`Detected that you are running on a CI server (${ci.name ?? ""}) and so will not generate a user .npmrc file. Use --force to override.`,
		);
		prompts.outro(outroPrompts);

		return StatusCodes.Success;
	}

	const projectNpmrcMode = registry
		? "registry"
		: !organization && !feed
			? "parse"
			: "make";

	const optionsSuffix =
		`- mode: ${projectNpmrcMode}\n` +
		(projectNpmrcMode === "registry"
			? `- registry: ${registry ?? ""}`
			: projectNpmrcMode === "parse"
				? `- config: ${config ?? "[default: <cwd>/.npmrc]"}`
				: `- organization: ${organization ?? ""}\n- project: ${project ?? ""}\n- feed: ${feed ?? ""}`);

	prompts.log.info(
		`options:${whatIf ? "\n- what-if" : ""}${force ? "\n- force" : ""}
- pat: ${pat ? "supplied" : "[will acquire from Azure CLI]"}
- email: ${email ?? "[default ADO value]"}
- daysToExpiry: ${daysToExpiry !== undefined ? daysToExpiry.toLocaleString() : "[API will determine expiry]"}
${optionsSuffix}`,
	);

	try {
		const parsedProjectNpmrcs = await withSpinner(
			projectNpmrcMode === "registry"
				? `Using supplied registry`
				: projectNpmrcMode === "parse"
					? `Parsing project .npmrc`
					: "Making parsed project .npmrc",
			logger,
			async (logger) => {
				return projectNpmrcMode === "registry"
					? [projectNpmrcRegistry({ registry: registry ?? "", logger })]
					: projectNpmrcMode === "parse"
						? await projectNpmrcParse({
								npmrcPath: config
									? path.resolve(config)
									: path.resolve(process.cwd(), ".npmrc"),
								logger,
							})
						: [
								projectNpmrcMake({
									organization: organization ?? "",
									project,
									feed: feed ?? "",
								}),
							];
			},
		);

		const personalAccessToken = pat
			? {
					patToken: {
						token: pat,
					},
				}
			: await withSpinner(`Creating Personal Access Token`, logger, (logger) =>
					createPat({
						logger,
						organization: parsedProjectNpmrcs[0].organization,
						daysToExpiry,
					}),
				);

		const validTo =
			"validTo" in personalAccessToken.patToken
				? personalAccessToken.patToken.validTo
				: undefined;

		const npmrc = await withSpinner(
			`Constructing user .npmrc`,
			logger,
			(_logger) =>
				Promise.resolve(
					parsedProjectNpmrcs
						.map((parsedProjectNpmrc) =>
							createUserNpmrc({
								parsedProjectNpmrc,
								email,
								pat: personalAccessToken.patToken.token,
								validTo,
							}),
						)
						.join("\n"),
				),
		);

		if (whatIf) {
			console.log(pc.dim("--- what-if: user .npmrc output (not written) ---"));
			console.log(npmrc);
			console.log(pc.dim("--- end what-if ---"));
		} else {
			await withSpinner(`Writing user .npmrc`, logger, (logger) => {
				return writeNpmrc({
					npmrc,
					logger,
				});
			});
		}

		prompts.outro(outroPrompts);

		return StatusCodes.Success;
	} catch (error) {
		const message = getErrorMessage(error);

		prompts.log.error(`Error: ${message}`);
		prompts.cancel(operationMessage("failed"));
		prompts.outro(outroPrompts);

		return StatusCodes.Failure;
	}
}
