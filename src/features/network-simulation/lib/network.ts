import {
	type Device,
	createDevice,
	createNetworkService,
} from "../../../entities/device/model/types.ts";
import { createFilesystem } from "../../../entities/virtual-filesystem/lib/create-default-fs.ts";
import {
	type NetworkState,
	addDevice,
	createNetworkState,
} from "../model/types.ts";

/**
 * Creates the visitor device with minimal filesystem.
 */
function createVisitorDevice(): Device {
	const visitorFs = createFilesystem({
		hostname: "visitor",
		includeResume: false,
		readmeContent: `Welcome, Visitor!

You're currently connected to your local device.

Available commands:
  ls          - list directory contents
  cd          - change directory
  pwd         - print working directory
  cat         - display file contents
  clear       - clear the terminal screen
  arp -a      - display ARP table (network neighbors)
  ping <ip>   - check if a host is reachable
  nmap [options] <ip> - scan for open ports on a host
    -sV                 - probe open ports to determine service/version info
    --script http-methods - enumerate supported HTTP methods and endpoints
  ssh <user>@<ip> - connect to a remote host

Try exploring the network!
`.trim(),
	});

	return createDevice(
		"visitor-device",
		"visitor-pc",
		"192.168.1.10",
		"00:50:56:c0:00:10",
		visitorFs,
		[],
	);
}

/**
 * Creates the gyeonghokim device with full filesystem including resume.
 */
function createGyeonghoDevice(): Device {
	const gyeonghoFs = createFilesystem({
		hostname: "gyeonghokim",
		includeResume: true,
	});

	return createDevice(
		"gyeongho-device",
		"gyeongho-mac",
		"192.168.1.20",
		"00:50:56:c0:00:08",
		gyeonghoFs,
		[
			createNetworkService(22, "ssh", "open", "OpenSSH 8.9p1"),
			createNetworkService(80, "http", "closed"),
			createNetworkService(8080, "http", "open", "Apache/2.4.52", {
				endpoints: ["/api/upload", "/api/files", "/admin/dashboard"],
				methods: ["GET", "POST", "PUT", "DELETE"],
			}),
		],
	);
}

let networkInstance: NetworkState | null = null;

/**
 * Initializes the global network simulation.
 */
export function initializeNetwork(): NetworkState {
	if (networkInstance) {
		return networkInstance;
	}

	const network = createNetworkState("192.168.1.0/24");

	addDevice(network, createVisitorDevice());
	addDevice(network, createGyeonghoDevice());

	networkInstance = network;
	return network;
}

/**
 * Gets the current network state.
 */
export function getNetwork(): NetworkState {
	if (!networkInstance) {
		return initializeNetwork();
	}
	return networkInstance;
}

/**
 * Resets the network state.
 */
export function resetNetwork(): void {
	networkInstance = null;
}
