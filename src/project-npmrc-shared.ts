import type { Logger } from "./shared/cli/logger.js";
import type { ParsedProjectNpmrc } from "./types.js";

const AZDO_HOST = "pkgs.dev.azure.com";

export function makeParsedProjectNpmrcFromRegistry({
	registry,
	scope,
	logger,
	fullRegistryMatch,
}: {
	/** eg `https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/` */
	registry: string;
	/** eg `@myorg` */
	scope?: string;
	/** eg `@myorg:registry=https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/` */
	fullRegistryMatch?: string;
	logger: Logger;
}): ParsedProjectNpmrc {
	let parsed: URL;

	try {
		parsed = new URL(registry);
	} catch {
		throw new Error(
			`Unable to extract information: registry must be a valid URL (got: ${registry})`,
		);
	}

	if (parsed.protocol !== "https:") {
		throw new Error(
			`Unable to extract information: registry must use HTTPS (got: ${parsed.protocol.replace(":", "")})`,
		);
	}

	if (parsed.hostname !== AZDO_HOST) {
		throw new Error(
			`Unable to extract information: registry must be an Azure DevOps feed at ${AZDO_HOST} (got: ${parsed.hostname})`,
		);
	}

	const urlWithoutRegistryAtStart = registry.replace("https:", "");
	const urlWithoutRegistryAtEnd = urlWithoutRegistryAtStart.replace(
		/registry\/$/,
		"",
	);
	// extract the organization which we will use as the username
	// not sure why this is the case, but this is the behaviour
	// defined in ADO
	const organization = urlWithoutRegistryAtEnd.split("/")[3];

	if (!organization) {
		throw new Error(
			`Unable to extract information: could not determine organization from registry URL (got: ${registry})`,
		);
	}

	logger.info(`Parsed:
- fullRegistryMatch: ${fullRegistryMatch ?? ""}
- scope: ${scope ?? ""}
- organization: ${organization}
- urlWithoutRegistryAtStart: ${urlWithoutRegistryAtStart}
- urlWithoutRegistryAtEnd: ${urlWithoutRegistryAtEnd}`);

	return {
		fullRegistryMatch,
		urlWithoutRegistryAtStart,
		urlWithoutRegistryAtEnd,
		organization,
		scope,
	};
}
