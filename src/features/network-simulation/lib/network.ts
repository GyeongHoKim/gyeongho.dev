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

MISSION: Find and access the resume on the network.

Available commands:
  Filesystem:
    ls, cd, pwd, cat, clear
    echo 'text' > file  - write text to file
    edit <file>         - open file in text editor

  Network:
    arp -a              - display ARP table (network neighbors)
    ping <ip>           - check if a host is reachable
    nmap [opts] <ip>    - scan for open ports
      -sV               - probe service versions
      --script http-enum - enumerate HTTP endpoints
    ssh <user>@<ip>     - connect via SSH
    curl <url>          - make HTTP requests
      -X POST           - specify method
      -F "file=@name"   - upload file

HINTS:
  1. Start by discovering other devices: arp -a
  2. Scan discovered hosts for services: nmap -sV <ip>
  3. Some services may have vulnerabilities...
  4. Password hint: Check the README on the target machine
  5. Multiple paths lead to the same destination

Good luck, hacker!
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
