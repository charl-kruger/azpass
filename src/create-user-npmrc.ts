import type { ParsedProjectNpmrc } from "./types.js";

/**
 * Make a user .npmrc file that looks a little like this:
 *
 * ; begin auth token
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:username=charlkruger
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/registry/:email=npm requires email to be set but doesn't use the value
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:username=charlkruger
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:_password=[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]
 * //pkgs.dev.azure.com/charlkruger/_packaging/npmrc-script-organization/npm/:email=npm requires email to be set but doesn't use the value
 * ; end auth token
 */
export function createUserNpmrc({
	email = "npm requires email to be set but doesn't use the value",
	parsedProjectNpmrc,
	pat,
	validTo,
}: {
	email?: string | undefined;
	parsedProjectNpmrc: ParsedProjectNpmrc;
	pat: string;
	validTo?: string | undefined;
}): string {
	const base64EncodedPAT = Buffer.from(pat).toString("base64");

	const {
		urlWithoutRegistryAtEnd,
		urlWithoutRegistryAtStart,
		organization,
		scope,
		fullRegistryMatch,
	} = parsedProjectNpmrc;

	const expiryComment = validTo ? `\n; expires: ${validTo}` : "";

	const npmrc = `; begin auth token${expiryComment}${scope && fullRegistryMatch ? `\n${fullRegistryMatch}` : ""}
${urlWithoutRegistryAtStart}:username=${organization}
${urlWithoutRegistryAtStart}:_password=${base64EncodedPAT}
${urlWithoutRegistryAtStart}:email=${email}
${urlWithoutRegistryAtEnd}:username=${organization}
${urlWithoutRegistryAtEnd}:_password=${base64EncodedPAT}
${urlWithoutRegistryAtEnd}:email=${email}
; end auth token
`;

	return npmrc;
}
