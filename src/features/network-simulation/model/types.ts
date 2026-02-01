import type { Device } from "../../../entities/device/model/types.ts";

/**
 * Global network simulation state.
 */
export interface NetworkState {
	devices: Map<string, Device>;
	subnet: string;
}

/**
 * Creates a new network state with the given subnet.
 */
export function createNetworkState(subnet: string): NetworkState {
	return {
		devices: new Map(),
		subnet,
	};
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
