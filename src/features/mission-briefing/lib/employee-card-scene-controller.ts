/**
 * Controller for the mission briefing 3D scene — create and dispose EmployeeCardScene.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import {
	createEmployeeCardScene,
	type EmployeeCardScene,
} from "./employee-card-scene.js";

export class EmployeeCardSceneController implements ReactiveController {
	private _sceneApi: EmployeeCardScene | null = null;

	constructor(host: LitElement) {
		host.addController(this);
	}

	/**
	 * Initializes the scene with the given canvas. Call from the host's firstUpdated.
	 */
	init(canvas: HTMLCanvasElement): void {
		this._sceneApi = createEmployeeCardScene(canvas);
	}

	hostDisconnected(): void {
		this._sceneApi?.dispose();
		this._sceneApi = null;
	}
}
