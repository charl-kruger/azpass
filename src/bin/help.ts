import pc from "picocolors";

import { allArgOptions } from "../shared/options/args.js";

interface HelpTextSection {
	sectionHeading: string;
	subsections: {
		flags: SubsectionFlag[];
		subheading?: string;
		warning?: string;
	}[];
}

interface SubsectionFlag {
	description: string;
	flag: string;
	short: string;
	type: string;
}

export function logHelpText(introLogs: string[]): void {
	const helpTextSections = createHelpTextSections();

	for (const log of introLogs) {
		console.log(log);
		console.log(" ");
	}

	console.log(
		pc.cyan(
			`Configure local development environments for Azure apps with one command`,
		),
	);

	console.log(" ");
	console.log(pc.bgGreen(pc.black("Subcommands:")));
	console.log(
		pc.cyan(`
  azpass config list                  List all saved config values
  azpass config get <key>             Get a saved config value
  azpass config set <key> <value>     Save a config value (keys: daysToExpiry, email, organization, project, feed)
  azpass status                       Show auth status for all Azure DevOps feeds in ~/.npmrc`),
	);

	for (const section of helpTextSections) {
		logHelpTextSection(section);

		console.log();
	}
}

function createHelpTextSections(): HelpTextSection[] {
	const core: HelpTextSection = {
		sectionHeading: "Core options:",
		subsections: [
			{
				flags: [],
			},
		],
	};

	const optional: HelpTextSection = {
		sectionHeading: "Optional options:",
		subsections: [
			{
				flags: [],
			},
		],
	};

	const subsections = {
		core: core.subsections[0],
		optional: optional.subsections[0],
	};

	for (const [option, data] of Object.entries(allArgOptions)) {
		subsections[data.docsSection].flags.push({
			description: data.description,
			flag: option,
			short: data.short,
			type: data.type,
		});
	}

	return [core, optional];
}

function logHelpTextSection(section: HelpTextSection): void {
	console.log(" ");

	console.log(pc.bgGreen(pc.black(section.sectionHeading)));

	for (const subsection of section.subsections) {
		if (subsection.warning) {
			console.log(pc.yellow(subsection.warning));
		}

		if (subsection.subheading) {
			console.log(pc.green(subsection.subheading));
		}

		for (const { description, flag, short, type } of subsection.flags) {
			console.log(
				pc.cyan(
					`
  -${short} | --${flag}${type !== "boolean" ? ` (${pc.cyan(type)})` : ""}: ${description}`,
				),
			);
		}
	}
}
