import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "./command-interpreter.ts";

/**
 * Type for a command handler function.
 */
export type CommandHandler = (
	args: string[],
	context: ExecuteCommandContext,
) => Promise<ExecuteCommandResult> | ExecuteCommandResult;

/**
 * Command metadata.
 */
export interface CommandMetadata {
	name: string;
	description: string;
	usage: string;
	handler: CommandHandler;
}

/**
 * Registry for terminal commands.
 */
export class CommandRegistry {
	private commands: Map<string, CommandMetadata> = new Map();

	/**
	 * Registers a command.
	 */
	register(metadata: CommandMetadata): void {
		this.commands.set(metadata.name, metadata);
	}

	/**
	 * Gets a command by name.
	 */
	get(name: string): CommandMetadata | undefined {
		return this.commands.get(name);
	}

	/**
	 * Checks if a command exists.
	 */
	has(name: string): boolean {
		return this.commands.has(name);
	}

	/**
	 * Lists all registered commands.
	 */
	list(): CommandMetadata[] {
		return Array.from(this.commands.values());
	}

	/**
	 * Executes a command by name with the given arguments and context.
	 */
	async execute(
		name: string,
		args: string[],
		context: ExecuteCommandContext,
	): Promise<ExecuteCommandResult> {
		const command = this.commands.get(name);
		if (!command) {
			throw new Error(`Command not found: ${name}`);
		}
		return await command.handler(args, context);
	}
}
