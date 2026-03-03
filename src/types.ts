export interface ParsedProjectNpmrc {
	/** eg `@myorg:registry=https://pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/` */
	fullRegistryMatch: string | undefined;
	/** eg `charlkruger` */
	organization: string;
	/** eg `@myorg` */
	scope: string | undefined;
	/** eg `//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/` */
	urlWithoutRegistryAtEnd: string;
	/** eg `//pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/` */
	urlWithoutRegistryAtStart: string;
}

export interface TokenResult {
	patToken: {
		displayName: string;
		validTo: string;
		scope: string;
		targetAccounts: string[];
		validFrom: string;
		authorizationId: string;
		token: string;
	};
	patTokenError: string;
}
