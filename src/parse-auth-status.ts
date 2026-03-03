export interface AuthEntry {
	expiresAt: Date | undefined;
	organization: string;
	registry: string;
}

const AUTH_BLOCK_RE = /; begin auth token\r?\n([\s\S]*?); end auth token/g;

const EXPIRES_RE = /^; expires: (.+)$/m;

// Matches e.g. //pkgs.dev.azure.com/my-org/_packaging/feed/npm/registry/
const REGISTRY_URL_RE = /\/\/(pkgs\.dev\.azure\.com\/[^/:]+)/;

export function parseAuthStatus(content: string): AuthEntry[] {
	const entries: AuthEntry[] = [];

	for (const match of content.matchAll(AUTH_BLOCK_RE)) {
		const block = match[1];

		const expiresMatch = EXPIRES_RE.exec(match[0]);
		let expiresAt: Date | undefined;
		if (expiresMatch) {
			const d = new Date(expiresMatch[1].trim());
			expiresAt = isNaN(d.getTime()) ? undefined : d;
		}

		const registryMatch = REGISTRY_URL_RE.exec(block);
		if (!registryMatch) continue;

		const registry = registryMatch[1]; // e.g. pkgs.dev.azure.com/my-org
		const slashIndex = registry.indexOf("/");
		const organization =
			slashIndex !== -1 ? registry.slice(slashIndex + 1) : registry;

		entries.push({ expiresAt, organization, registry });
	}

	return entries;
}
