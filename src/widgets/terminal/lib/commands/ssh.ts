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
 * Parses SSH connection string (user@ip).
 */
function parseSshConnection(connectionString: string): {
	user: string;
	ip: string;
} | null {
	const parts = connectionString.split("@");
	if (parts.length !== 2) {
		return null;
	}
	return {
		user: parts[0],
		ip: parts[1],
	};
}

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
 * Executes the SSH command to connect to a remote device.
 */
export function executeSsh(
	args: string[],
	_context: ExecuteCommandContext,
): ExecuteCommandResult {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg("Usage: ssh <user>@<ip>", { desc: "ssh usage error" }),
			),
		};
	}

	const connectionString = args[0];
	const connection = parseSshConnection(connectionString);

	if (!connection) {
		return {
			result: createErrorResult(
				msg(str`ssh: invalid connection string: ${connectionString}`, {
					desc: "ssh error",
				}),
			),
		};
	}

	const { user, ip } = connection;

	if (!isValidIp(ip)) {
		return {
			result: createErrorResult(
				msg(str`ssh: invalid IP address: ${ip}`, {
					desc: "ssh error",
				}),
			),
		};
	}

	// Check if the device exists in the network
	const network = getNetwork();
	const device = getDeviceByIp(network, ip);

	if (!device) {
		return {
			result: createErrorResult(
				msg(str`ssh: connect to host ${ip} port 22: No route to host`, {
					desc: "ssh connection error",
				}),
			),
		};
	}

	// Check if SSH service is available
	const sshService = device.services.find(
		(service) => service.name === "ssh" && service.state === "open",
	);

	if (!sshService) {
		return {
			result: createErrorResult(
				msg(str`ssh: connect to host ${ip} port 22: Connection refused`, {
					desc: "ssh connection error",
				}),
			),
		};
	}

	// Validate user exists on target device
	// Currently only support "gyeonghokim" and "visitor"
	if (user !== "gyeonghokim" && user !== "visitor") {
		return {
			result: createErrorResult(
				msg(str`${user}@${ip}: Permission denied (publickey,password).`, {
					desc: "ssh auth error",
				}),
			),
		};
	}

	return {
		result: createSuccessResult(""),
		needsSshPassword: {
			ip,
			user: user === "gyeonghokim" ? "gyeonghokim" : "visitor",
		},
	};
}
