import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

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
				adapter: adapter(),
				csp: {
					mode: 'auto',
					directives: {
						'default-src': ['self'],
						'script-src': ['self'],
						'style-src': ['self', 'unsafe-inline'],
						'img-src': ['self', 'data:'],
						'frame-ancestors': ['none'],
						'object-src': ['none'],
						'base-uri': ['none'],
						'form-action': ['self'],
						'frame-src': ['none']
					}
				}
			})
		]
	};
});
