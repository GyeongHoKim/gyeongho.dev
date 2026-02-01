import { msg } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import { getNetwork } from "../../../../features/network-simulation/lib/network.ts";
import { listDevices } from "../../../../features/network-simulation/model/types.ts";

/**
 * Executes the ARP command to display the network ARP table.
 */
export function executeArp(
	args: string[],
	_context: ExecuteCommandContext,
): ExecuteCommandResult {
	// Check for -a flag (most common usage)
	if (args.length > 0 && args[0] !== "-a") {
		return {
			result: createErrorResult(
				msg("Usage: arp -a", { desc: "arp usage error" }),
			),
		};
	}

	// Get the network and list all devices
	const network = getNetwork();
	const devices = listDevices(network);

	// Format ARP table output
	const arpEntries = devices
		.map((device) => {
			return `? (${device.ip}) at ${device.mac} on en0`;
		})
		.join("\n");

	return {
		result: createSuccessResult(arpEntries),
	};
}
