import { esbuildPlugin } from "@web/dev-server-esbuild";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(rootDir, "public");

export const baseConfig = {
	nodeResolve: true,
	plugins: [esbuildPlugin({ ts: true, tsconfig: "tsconfig.json" })],
	middleware: [
		async (ctx, next) => {
			const publicPath = path.resolve(publicDir, `.${ctx.path}`);
			if (!publicPath.startsWith(`${publicDir}${path.sep}`)) {
				await next();
				return;
			}
			if (!existsSync(publicPath)) {
				await next();
				return;
			}
			const stats = statSync(publicPath);
			if (!stats.isFile()) {
				await next();
				return;
			}

			ctx.type = path.extname(publicPath);
			ctx.body = createReadStream(publicPath);
		},
	],
};
