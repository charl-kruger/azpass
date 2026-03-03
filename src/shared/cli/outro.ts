import * as prompts from "@clack/prompts";
import pc from "picocolors";

export interface OutroGroup {
	label: string;
	lines?: string[];
	variant?: "code";
}

export function outro(groups: OutroGroup[]) {
	prompts.outro(pc.blue(`Great, looks like the script finished! 🎉`));

	for (const { label, lines, variant } of groups) {
		console.log(pc.blue(label));
		console.log();

		if (lines) {
			for (const line of lines) {
				console.log(variant === "code" ? pc.gray(line) : line);
			}

			console.log();
		}
	}

	console.log(pc.green(`See ya! 👋`));
	console.log();
}
