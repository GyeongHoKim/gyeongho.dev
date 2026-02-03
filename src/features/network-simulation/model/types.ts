import type { Device } from "../../../entities/device/model/types.ts";

/**
 * HTTP request representation for the simulated web server.
 */
export interface HttpRequest {
	method: "GET" | "POST" | "PUT" | "DELETE";
	path: string;
	queryParams: Record<string, string>;
	body?: string;
	formData?: Record<string, string | { filename: string; content: string }>;
}

/**
 * HTTP response representation from the simulated web server.
 */
export interface HttpResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
	/** True if this response triggers resume reveal */
	resumeRevealed?: boolean;
}

/**
 * State for a simulated HTTP service on a device.
 */
export interface HttpServiceState {
	/** Files uploaded to this server */
	uploadedFiles: Map<string, { filename: string; content: string }>;
}

/**
 * Global network simulation state.
 */
export interface NetworkState {
	devices: Map<string, Device>;
	subnet: string;
	/** HTTP service state per device IP (for devices with HTTP services) */
	httpServices: Map<string, HttpServiceState>;
}

/**
 * Creates a new network state with the given subnet.
 */
export function createNetworkState(subnet: string): NetworkState {
	return {
		devices: new Map(),
		subnet,
		httpServices: new Map(),
	};
}

/**
 * Creates or gets the HTTP service state for a device.
 */
export function getOrCreateHttpServiceState(
	network: NetworkState,
	ip: string,
): HttpServiceState {
	let state = network.httpServices.get(ip);
	if (!state) {
		state = { uploadedFiles: new Map() };
		network.httpServices.set(ip, state);
	}
	return state;
}

/**
 * Adds a device to the network state.
 */
export function addDevice(network: NetworkState, device: Device): NetworkState {
	network.devices.set(device.ip, device);
	return network;
}

/**
 * Gets a device by IP address.
 */
export function getDeviceByIp(
	network: NetworkState,
	ip: string,
): Device | undefined {
	return network.devices.get(ip);
}

/**
 * Lists all devices in the network.
 */
export function listDevices(network: NetworkState): Device[] {
	return Array.from(network.devices.values());
}
