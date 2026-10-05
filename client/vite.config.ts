import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import type { Config } from '@sveltejs/kit';

type ConnectSrc = NonNullable<NonNullable<NonNullable<Config['csp']>['directives']>['connect-src']>;

function apiOrigin(env: Record<string, string>): ConnectSrc {
	const base = env.PUBLIC_API_BASE_URL;
	if (!base) return [];
	try {
		return [new URL(base).origin as ConnectSrc[number]];
	} catch {
		return [];
	}
}

function appBasePath(raw: string | undefined): '' | `/${string}` {
	const bersih = (raw ?? '').trim().replace(/\/+$/, '');
	if (!bersih) return '';
	return (bersih.startsWith('/') ? bersih : `/${bersih}`) as `/${string}`;
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const port = Number(env.PORT) || 3000;

	return {
		server: {
			host: '0.0.0.0',
			port
		},
		optimizeDeps: {
			include: [
				'@lucide/svelte',
				'clsx',
				'svelte',
				'svelte/attachments',
				'svelte/events',
				'svelte/internal/client',
				'svelte/internal/disclose-version',
				'svelte/legacy',
				'svelte/reactivity',
				'svelte/store',
				'tailwind-merge'
			]
		},
		plugins: [
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				paths: {
					base: appBasePath(env.PUBLIC_BASE_PATH)
				},
				adapter: adapter({
					fallback: 'index.html'
				}),
				csp: {
					mode: 'auto',
					directives: {
						'default-src': ['self'],
						'script-src': ['self'],
						'style-src': ['self', 'unsafe-inline'],
						'img-src': ['self', 'data:'],
						'object-src': ['none'],
						'base-uri': ['none'],
						'form-action': ['self'],
						'frame-src': ['none'],
						'connect-src': ['self', ...apiOrigin(env)]
					}
				}
			})
		]
	};
});
