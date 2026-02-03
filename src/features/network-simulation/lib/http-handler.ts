/**
 * HTTP Request Handler for Simulated Web Server
 *
 * Simulates a web server with file upload vulnerability (no extension validation).
 * Executable scripts: .php (PHP), .jsp (Java/Tomcat), .js (Node.js).
 * Endpoints:
 *   GET  /api/files    - List uploaded files
 *   POST /api/upload   - Upload a file (no extension validation = vulnerability)
 *   GET  /uploads/{file} - Access/execute uploaded files (?cmd= for .php/.js)
 *   GET  /admin/dashboard - Returns 403 Forbidden (red herring)
 */

import type {
	HttpRequest,
	HttpResponse,
	HttpServiceState,
} from "../model/types.ts";
import {
	type NetworkState,
	getDeviceByIp,
	getOrCreateHttpServiceState,
} from "../model/types.ts";

/**
 * Creates a JSON HTTP response.
 */
function jsonResponse(
	status: number,
	data: unknown,
	resumeRevealed = false,
): HttpResponse {
	return {
		status,
		statusText: getStatusText(status),
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data, null, 2),
		resumeRevealed,
	};
}

/**
 * Creates a plain text HTTP response.
 */
function textResponse(
	status: number,
	body: string,
	resumeRevealed = false,
): HttpResponse {
	return {
		status,
		statusText: getStatusText(status),
		headers: { "Content-Type": "text/plain" },
		body,
		resumeRevealed,
	};
}

/**
 * Creates an HTML HTTP response.
 */
function htmlResponse(
	status: number,
	body: string,
	resumeRevealed = false,
): HttpResponse {
	return {
		status,
		statusText: getStatusText(status),
		headers: { "Content-Type": "text/html" },
		body,
		resumeRevealed,
	};
}

/**
 * Gets the status text for an HTTP status code.
 */
function getStatusText(status: number): string {
	const statusTexts: Record<number, string> = {
		200: "OK",
		201: "Created",
		400: "Bad Request",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		500: "Internal Server Error",
	};
	return statusTexts[status] || "Unknown";
}

/**
 * Handles GET /api/files - List uploaded files
 */
function handleListFiles(serviceState: HttpServiceState): HttpResponse {
	const files = Array.from(serviceState.uploadedFiles.keys());
	return jsonResponse(200, {
		files,
		uploadDir: "/var/www/uploads/",
		message: "Use POST /api/upload to upload files",
	});
}

/**
 * Handles POST /api/upload - Upload a file (VULNERABLE: no extension check)
 */
function handleUpload(
	request: HttpRequest,
	serviceState: HttpServiceState,
): HttpResponse {
	if (!request.formData) {
		return jsonResponse(400, {
			error: "No form data provided",
			usage: 'curl -X POST -F "file=@yourfile.ext" /api/upload',
		});
	}

	// Look for file in form data
	const fileField = request.formData.file;
	if (!fileField || typeof fileField === "string") {
		return jsonResponse(400, {
			error: "No file provided",
			usage: 'curl -X POST -F "file=@yourfile.ext" /api/upload',
		});
	}

	const { filename, content } = fileField;
	if (!filename) {
		return jsonResponse(400, { error: "Filename is required" });
	}

	// VULNERABILITY: No extension validation!
	// A real secure server would reject .php, .sh, etc.
	serviceState.uploadedFiles.set(filename, { filename, content });

	return jsonResponse(201, {
		success: true,
		message: "File uploaded successfully",
		path: `/uploads/${filename}`,
		warning:
			"Note: This server does not validate file extensions. This is a security vulnerability.",
	});
}

/**
 * Simulates webshell execution - looks for command execution patterns (PHP, JSP, Node.js)
 */
function executeWebshell(content: string, cmd: string): string {
	// Check for common webshell patterns: PHP, JSP (Java), or Node.js
	const isWebshell =
		content.includes("shell_exec") ||
		content.includes("system(") ||
		content.includes("exec(") ||
		content.includes("passthru(") ||
		content.includes("child_process") ||
		content.includes("execSync") ||
		content.includes("spawnSync") ||
		content.includes("Runtime.getRuntime()") ||
		content.includes("ProcessBuilder") ||
		(content.includes("getParameter") && content.includes("exec"));

	if (!isWebshell) {
		return content; // Just return the file content if not a webshell
	}

	// Simulate command execution
	const decodedCmd = decodeURIComponent(cmd);

	// Handle 'cat /resume' or variations
	if (
		decodedCmd.includes("cat") &&
		(decodedCmd.includes("/resume") || decodedCmd.includes("resume"))
	) {
		return "RESUME_CONTENT_MARKER"; // Special marker for resume reveal
	}

	// Handle 'ls' command
	if (decodedCmd === "ls" || decodedCmd === "ls -la") {
		return `/var/www/uploads/
total 8
drwxr-xr-x 2 www-data www-data 4096 Jan  1 00:00 .
drwxr-xr-x 3 www-data www-data 4096 Jan  1 00:00 ..`;
	}

	// Handle 'id' command
	if (decodedCmd === "id") {
		return "uid=33(www-data) gid=33(www-data) groups=33(www-data)";
	}

	// Handle 'whoami' command
	if (decodedCmd === "whoami") {
		return "www-data";
	}

	// Handle 'pwd' command
	if (decodedCmd === "pwd") {
		return "/var/www/uploads";
	}

	// Handle 'uname -a' command
	if (decodedCmd === "uname -a" || decodedCmd === "uname") {
		return "Linux gyeongho-web 5.15.0-generic #1 SMP x86_64 GNU/Linux";
	}

	// Generic command - show command was executed
	return `Command executed: ${decodedCmd}\n(simulated output)`;
}

/**
 * Handles GET /uploads/{filename} - Access uploaded files
 */
function handleGetUpload(
	path: string,
	queryParams: Record<string, string>,
	serviceState: HttpServiceState,
): HttpResponse {
	// Extract filename from path /uploads/filename.ext
	const match = path.match(/^\/uploads\/(.+)$/);
	if (!match) {
		return jsonResponse(404, { error: "File not found" });
	}

	const filename = match[1];
	const fileData = serviceState.uploadedFiles.get(filename);

	if (!fileData) {
		return jsonResponse(404, {
			error: `File not found: ${filename}`,
			hint: "Use GET /api/files to list uploaded files",
		});
	}

	// Check if this is an executable script (PHP, JSP, or Node.js) being "executed"
	const isExecutableScript =
		filename.endsWith(".php") ||
		filename.endsWith(".jsp") ||
		filename.endsWith(".js");
	if (isExecutableScript) {
		const cmd = queryParams.cmd;
		if (cmd) {
			const output = executeWebshell(fileData.content, cmd);

			// Check for resume reveal
			if (output === "RESUME_CONTENT_MARKER") {
				return textResponse(
					200,
					`ACCESS GRANTED

Executing command on remote server...

[*] Reading /resume...
[*] Permission granted via webshell bypass

Resume data retrieved successfully.
The resume viewer will now open.`,
					true, // resumeRevealed
				);
			}

			return textResponse(200, output);
		}
		// Script without cmd parameter - show the source and hint
		const lang =
			filename.endsWith(".php")
				? "PHP"
				: filename.endsWith(".jsp")
					? "JSP (Java)"
					: "JavaScript";
		return htmlResponse(
			200,
			`<pre>${fileData.content}</pre>
<p>Hint: This is a ${lang} file. Try adding ?cmd=whoami to execute commands.</p>`,
		);
	}

	// Regular file - just return content
	return textResponse(200, fileData.content);
}

/**
 * Handles GET /admin/dashboard - Red herring (403 Forbidden)
 */
function handleAdminDashboard(): HttpResponse {
	return htmlResponse(
		403,
		`<!DOCTYPE html>
<html>
<head><title>403 Forbidden</title></head>
<body>
<h1>Forbidden</h1>
<p>You don't have permission to access this resource.</p>
<hr>
<address>Apache/2.4.52 Server at 192.168.1.20 Port 8080</address>
</body>
</html>`,
	);
}

/**
 * Handles the root path
 */
function handleRoot(): HttpResponse {
	return htmlResponse(
		200,
		`<!DOCTYPE html>
<html>
<head><title>Welcome</title></head>
<body>
<h1>Welcome to the Web Server</h1>
<p>Available endpoints:</p>
<ul>
  <li>GET /api/files - List uploaded files</li>
  <li>POST /api/upload - Upload a file</li>
  <li>GET /uploads/{file} - Access uploaded files</li>
</ul>
</body>
</html>`,
	);
}

/**
 * Main HTTP request handler for simulated web server.
 */
export function handleHttpRequest(
	network: NetworkState,
	targetIp: string,
	port: number,
	request: HttpRequest,
): HttpResponse {
	// Check if the device exists and has HTTP service
	const device = getDeviceByIp(network, targetIp);
	if (!device) {
		return textResponse(500, `Connection refused: Host ${targetIp} not found`);
	}

	const httpService = device.services.find(
		(s) => s.port === port && s.name === "http" && s.state === "open",
	);
	if (!httpService) {
		return textResponse(
			500,
			`Connection refused: No HTTP service on ${targetIp}:${port}`,
		);
	}

	// Get or create HTTP service state for this device
	const serviceState = getOrCreateHttpServiceState(network, targetIp);

	const { method, path, queryParams } = request;

	// Route requests
	if (path === "/" || path === "") {
		return handleRoot();
	}

	if (path === "/api/files") {
		if (method !== "GET") {
			return jsonResponse(405, { error: "Method not allowed", allowed: ["GET"] });
		}
		return handleListFiles(serviceState);
	}

	if (path === "/api/upload") {
		if (method !== "POST") {
			return jsonResponse(405, {
				error: "Method not allowed",
				allowed: ["POST"],
			});
		}
		return handleUpload(request, serviceState);
	}

	if (path.startsWith("/uploads/")) {
		if (method !== "GET") {
			return jsonResponse(405, { error: "Method not allowed", allowed: ["GET"] });
		}
		return handleGetUpload(path, queryParams, serviceState);
	}

	if (path === "/admin/dashboard" || path === "/admin") {
		return handleAdminDashboard();
	}

	// 404 for unknown paths
	return jsonResponse(404, {
		error: "Not Found",
		path,
		availableEndpoints: ["/api/files", "/api/upload", "/uploads/{file}"],
	});
}
