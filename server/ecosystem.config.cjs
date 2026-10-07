module.exports = {
	apps: [
		{
			name: 'pandora-message',
			script: __dirname + '/build/index.js',
			cwd: __dirname,
			env: {
				NODE_ENV: 'production',
				PRIVATE_API_BASE_URL: 'http://localhost:8080',
				COOKIE_SECURE: 'true',
				PORT: 3000,
				PRIVATE_API_KEY: 'key_db5be47f07ea3f2a5118553bb3700298c9534fb0a8f1714251dedcfc6c36437d',
				SESSION_COOKIE_MODE: 'session'
			}
		}
	]
};