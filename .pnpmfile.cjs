// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-require-imports */
const pjson = require('./package.json');

function rewriteGithub(record) {
	return Object.fromEntries(
		Object.entries(record).map(([k, v]) => {
			const parts = /github:([^/]*)\/([^#]*)(?:#(.*))?$/.exec(v);
			if (parts && /^phosphoriteart$/i.test(parts[1])) {
				const hash = parts[3] ? `#${parts[3]}` : '';
				return [k, `git+https://github.com/${parts[1]}/${parts[2]}.git${hash}`];
			}
			return [k, v];
		})
	);
}

// Updates `github:` URLs to HTTPS since SSH sometimes flakes on Vercel's infra
module.exports = {
	hooks: {
		readPackage: (pkg) => {
			if (pkg.name === pjson.name || pkg.name.startsWith('phosart')) {
				return {
					...pkg,
					dependencies: { ...rewriteGithub(pkg.dependencies) },
					devDependencies: { ...rewriteGithub(pkg.devDependencies) }
				};
			}
			return pkg;
		}
	}
};
