import { msg, str } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import { getNetwork } from "../../../network-simulation/lib/network.ts";
import { getDeviceByIp } from "../../../network-simulation/model/types.ts";

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
 * Executes the ping command to check host reachability.
 */
export function executePing(
	args: string[],
	_context: ExecuteCommandContext,
): ExecuteCommandResult {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg("Usage: ping <ip>", { desc: "ping usage error" }),
			),
		};
	}

	const targetIp = args[0];

	if (!isValidIp(targetIp)) {
		return {
			result: createErrorResult(
				msg(str`ping: invalid IP address: ${targetIp}`, {
					desc: "ping error",
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
				msg(
					str`Request timeout for icmp_seq 0\nping: ${targetIp}: Host is down`,
					{
						desc: "ping timeout",
					},
				),
			),
		};
	}

	const output = `PING ${targetIp} (${targetIp}): 56 data bytes
64 bytes from ${targetIp}: icmp_seq=0 ttl=64 time=0.123 ms
64 bytes from ${targetIp}: icmp_seq=1 ttl=64 time=0.098 ms
64 bytes from ${targetIp}: icmp_seq=2 ttl=64 time=0.105 ms

--- ${targetIp} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 0.098/0.109/0.123/0.011 ms`;

	return {
		result: createSuccessResult(output),
	};
}
