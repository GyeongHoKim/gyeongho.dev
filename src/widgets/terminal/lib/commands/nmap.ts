import { msg, str } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import { getNetwork } from "../../../../features/network-simulation/lib/network.ts";
import { getDeviceByIp } from "../../../../features/network-simulation/model/types.ts";

/**
 * Validates an IPv4 address format.
 */
function isValidIp(ip: string): boolean {
	const parts = ip.split(".");
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		const num = Number.parseInt(part, 10);
		return !Number.isNaN(num) && num >= 0 && num <= 255;
	});
}

/**
 * Executes the nmap command to scan for open ports.
 */
export function executeNmap(
	args: string[],
	_context: ExecuteCommandContext,
): ExecuteCommandResult {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg("Usage: nmap [options] <ip>", { desc: "nmap usage error" }),
			),
		};
	}

	const hasServiceVersion = args.includes("-sV");
	const hasHttpScript =
		args.includes("--script") &&
		(args.includes("http-methods") || args.includes("http-enum"));

	const targetIp = args[args.length - 1];

	if (!isValidIp(targetIp)) {
		return {
			result: createErrorResult(
				msg(str`nmap: invalid IP address: ${targetIp}`, {
					desc: "nmap error",
				}),
			),
		};
	}

	// Check if the device exists in the network
	const network = getNetwork();
	const device = getDeviceByIp(network, targetIp);

	if (!device) {
		return {
			result: createErrorResult(
				msg(str`nmap: ${targetIp}: Host seems down`, {
					desc: "nmap host down",
				}),
			),
		};
	}

	const header = `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${targetIp}
Host is up (0.0010s latency).`;

	const openServices = device.services.filter(
		(service) => service.state === "open",
	);

	if (openServices.length === 0) {
		return {
			result: createSuccessResult(
				`${header}
All 1000 scanned ports on ${targetIp} are closed`,
			),
		};
	}

	let portLines: string;
	let scriptOutput = "";

	if (hasServiceVersion) {
		portLines = openServices
			.map((service) => {
				const version = service.version ? ` ${service.version}` : "";
				return `${service.port}/tcp ${service.state.padEnd(6)} ${service.name}${version}`;
			})
			.join("\n");
	} else {
		portLines = openServices
			.map((service) => {
				return `${service.port}/tcp ${service.state.padEnd(6)} ${service.name}`;
			})
			.join("\n");
	}

	if (hasHttpScript) {
		const httpServices = openServices.filter((s) => s.name === "http");
		if (httpServices.length > 0) {
			scriptOutput = "\n";
			for (const service of httpServices) {
				if (service.metadata?.endpoints) {
					scriptOutput += `\nNSE: Script scanning ${targetIp}:${service.port}\n`;
					scriptOutput += `| http-enum:\n`;
					for (const endpoint of service.metadata.endpoints as string[]) {
						scriptOutput += `|   ${endpoint}\n`;
					}
					if (service.metadata.methods) {
						const methods = service.metadata.methods as string[];
						scriptOutput += `| http-methods:\n`;
						scriptOutput += `|   Supported Methods: ${methods.join(" ")}\n`;
					}
				}
			}
		}
	}

	const serviceHeader = hasServiceVersion
		? "PORT   STATE SERVICE VERSION"
		: "PORT   STATE SERVICE";
	const output = `${header}
${serviceHeader}
${portLines}${scriptOutput}

Nmap done: 1 IP address (1 host up) scanned in 0.12 seconds`;

	return {
		result: createSuccessResult(output),
	};
}
