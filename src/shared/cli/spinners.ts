import * as prompts from "@clack/prompts";
import pc from "picocolors";

import {
	type Logger,
	makeLogger,
	makeSpinnerLogger,
	type SpinnerLogger,
} from "./logger.js";
import { lowerFirst } from "./lower-first.js";

const spinner = prompts.spinner();

export type LabeledSpinnerTask<Return> = [string, SpinnerTask<Return>];

export type SpinnerTask<Return> = (logger: SpinnerLogger) => Promise<Return>;

export async function withSpinner<Return>(
	label: string,
	_logger: Logger,
	task: SpinnerTask<Return>,
) {
	const spinnerLogger = makeSpinnerLogger(makeLogger());

	spinner.start(`${label}...`);

	try {
		const result = await task(spinnerLogger);

		spinner.stop(pc.green(`✓ ${label}`));

		spinnerLogger.flush();

		return result;
	} catch (error) {
		spinner.error(pc.red(`✗ ${label}`));

		spinnerLogger.flush();

		throw new Error(`Failed ${lowerFirst(label)}`, { cause: error });
	}
}
