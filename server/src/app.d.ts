declare global {
	namespace App {
		interface Locals {
			username: string | null;
			rules: string | null;
			clientIp: string;
		}
	}
}

export {};