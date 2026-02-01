import type { VirtualFilesystem } from "../../virtual-filesystem/lib/fs-helpers.ts";

/**
 * Network service exposed by a device.
 */
export interface NetworkService {
	port: number;
	name: string;
	state: "open" | "closed" | "filtered";
	version?: string;
	metadata?: {
		endpoints?: string[];
		methods?: string[];
		[key: string]: unknown;
	};
}

/**
 * Device on the simulated network.
 */
export interface Device {
	id: string;
	hostname: string;
	ip: string;
	mac: string;
	fs: VirtualFilesystem;
	services: NetworkService[];
}

/**
 * Creates a network service.
 */
export function createNetworkService(
	port: number,
	name: string,
	state: "open" | "closed" | "filtered" = "open",
	version?: string,
	metadata?: NetworkService["metadata"],
): NetworkService {
	return { port, name, state, version, metadata };
}

/**
 * Creates a device with the given properties.
 */
export function createDevice(
	id: string,
	hostname: string,
	ip: string,
	mac: string,
	fs: VirtualFilesystem,
	services: NetworkService[] = [],
): Device {
	return {
		id,
		hostname,
		ip,
		mac,
		fs,
		services,
	};
}
