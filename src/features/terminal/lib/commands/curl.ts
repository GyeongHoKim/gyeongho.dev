/**
 * curl command implementation
 *
 * Simulates curl for HTTP requests to the simulated network.
 * Supports:
 *   - GET requests (default)
 *   - POST requests (-X POST)
 *   - File uploads (-F "file=@filename")
 *   - Form data (-F "key=value")
 */

import { msg, str } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import { readFile } from "../../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import { getNetwork } from "../../../network-simulation/lib/network.ts";
import { handleHttpRequest } from "../../../network-simulation/lib/http-handler.ts";
import type { HttpRequest } from "../../../network-simulation/model/types.ts";

/**
 * Parses a URL into components.
 */
function parseUrl(url: string): {
	protocol: string;
	host: string;
	port: number;
	path: string;
	queryParams: Record<string, string>;
} | null {
	// Match http://host:port/path?query or http://host/path?query
	const match = url.match(
		/^(https?):\/\/([^/:]+)(?::(\d+))?(\/[^?]*)?(\?.*)?$/,
	);
	if (!match) {
		return null;
	}

	const [, protocol, host, portStr, pathPart, queryPart] = match;
	const port = portStr ? Number.parseInt(portStr, 10) : 80;
	const path = pathPart || "/";

	// Parse query parameters
	const queryParams: Record<string, string> = {};
	if (queryPart) {
		const params = new URLSearchParams(queryPart.slice(1));
		for (const [key, value] of params) {
			queryParams[key] = value;
		}
	}

	return { protocol, host, port, path, queryParams };
}

/**
 * Parses curl arguments into method, URL, and form data.
 */
function parseCurlArgs(args: string[]): {
	method: "GET" | "POST" | "PUT" | "DELETE";
	url: string | null;
	formData: Record<string, string | { filename: string; content: string }>;
	errors: string[];
} {
	let method: "GET" | "POST" | "PUT" | "DELETE" = "GET";
	let url: string | null = null;
	const formData: Record<
		string,
		string | { filename: string; content: string }
	> = {};
	const errors: string[] = [];

	let i = 0;
	while (i < args.length) {
		const arg = args[i];

		if (arg === "-X" || arg === "--request") {
			i++;
			if (i >= args.length) {
				errors.push("curl: option -X requires an argument");
				break;
			}
			const m = args[i].toUpperCase();
			if (m === "GET" || m === "POST" || m === "PUT" || m === "DELETE") {
				method = m;
			} else {
				errors.push(`curl: unsupported method: ${args[i]}`);
			}
		} else if (arg === "-F" || arg === "--form") {
			i++;
			if (i >= args.length) {
				errors.push("curl: option -F requires an argument");
				break;
			}
			// Parse form data: key=value or file=@filename
			const formArg = args[i];
			const eqIndex = formArg.indexOf("=");
			if (eqIndex === -1) {
				errors.push(`curl: invalid form data: ${formArg}`);
			} else {
				const key = formArg.slice(0, eqIndex);
				const value = formArg.slice(eqIndex + 1);
				if (value.startsWith("@")) {
					// File upload
					const filename = value.slice(1);
					formData[key] = { filename, content: "" }; // Content filled later
				} else {
					formData[key] = value;
				}
			}
			// If we have form data, default to POST
			if (method === "GET") {
				method = "POST";
			}
		} else if (arg === "-d" || arg === "--data") {
			i++;
			if (i >= args.length) {
				errors.push("curl: option -d requires an argument");
				break;
			}
			// Raw data - store as body
			formData._body = args[i];
			if (method === "GET") {
				method = "POST";
			}
		} else if (arg === "-v" || arg === "--verbose") {
			// Ignored but accepted
		} else if (arg === "-s" || arg === "--silent") {
			// Ignored but accepted
		} else if (arg === "-o" || arg === "--output") {
			i++; // Skip the output filename
		} else if (arg.startsWith("-")) {
			// Unknown option - warn but continue
			errors.push(`curl: warning: unknown option ${arg}`);
		} else {
			// Assume it's the URL
			url = arg;
		}
		i++;
	}

	return { method, url, formData, errors };
}

/**
 * Executes the curl command.
 */
export async function executeCurl(
	args: string[],
	context: ExecuteCommandContext,
): Promise<ExecuteCommandResult> {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg(
					`Usage: curl [options] <url>
Options:
  -X, --request <method>   Specify request method (GET, POST, PUT, DELETE)
  -F, --form <key=value>   Send form data (use @filename for file upload)
  -d, --data <data>        Send raw data
  -v, --verbose            Verbose output
  -s, --silent             Silent mode

Examples:
  curl http://192.168.1.20:8080/api/files
  curl -X POST -F "file=@shell.php" http://192.168.1.20:8080/api/upload
  curl "http://192.168.1.20:8080/uploads/shell.php?cmd=whoami"`,
					{ desc: "curl usage" },
				),
			),
		};
	}

	const { method, url, formData, errors } = parseCurlArgs(args);

	// Show warnings but continue
	const warnings = errors.filter((e) => e.includes("warning"));
	const fatalErrors = errors.filter((e) => !e.includes("warning"));

	if (fatalErrors.length > 0) {
		return { result: createErrorResult(fatalErrors.join("\n")) };
	}

	if (!url) {
		return {
			result: createErrorResult(
				msg("curl: no URL specified", { desc: "curl error" }),
			),
		};
	}

	const parsed = parseUrl(url);
	if (!parsed) {
		return {
			result: createErrorResult(
				msg(str`curl: invalid URL: ${url}`, { desc: "curl error" }),
			),
		};
	}

	const { host, port, path, queryParams } = parsed;

	// Read file contents for file uploads
	for (const [key, value] of Object.entries(formData)) {
		if (typeof value === "object" && "filename" in value) {
			// Read file from virtual filesystem
			const filePath = value.filename.startsWith("/")
				? value.filename
				: `${context.session.cwd}/${value.filename}`;
			const fileResult = readFile(context.fs, filePath);
			if ("error" in fileResult) {
				return {
					result: createErrorResult(
						msg(
							str`curl: cannot read file '${value.filename}': ${fileResult.error}`,
							{
								desc: "curl error",
							},
						),
					),
				};
			}
			formData[key] = {
				filename: value.filename.split("/").pop() || value.filename,
				content: fileResult.content,
			};
		}
	}

	// Build HTTP request
	const request: HttpRequest = {
		method,
		path,
		queryParams,
		formData: Object.keys(formData).length > 0 ? formData : undefined,
	};

	// Execute request through network simulation
	const network = getNetwork();
	const response = handleHttpRequest(network, host, port, request);

	// Format output
	let output = "";
	if (warnings.length > 0) {
		output += `${warnings.join("\n")}\n`;
	}

	// Add response body
	output += response.body;

	// Check for resume reveal
	if (response.resumeRevealed) {
		return {
			result: {
				stdout: output,
				stderr: "",
				exitCode: 0,
				resumeRevealed: true,
			},
		};
	}

	if (response.status >= 400) {
		return {
			result: {
				stdout: output,
				stderr: `HTTP ${response.status} ${response.statusText}`,
				exitCode: 1,
				resumeRevealed: false,
			},
		};
	}

	return {
		result: createSuccessResult(output),
	};
}
