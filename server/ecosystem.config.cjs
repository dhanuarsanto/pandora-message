module.exports = {
	apps: [
		{
			name: 'pandora',
			script: __dirname + '/build/index.js',
			cwd: __dirname,
			env: { PORT: 3000, COOKIE_SECURE: 'false' }
		}
	]
};
