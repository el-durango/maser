import { BaseLogger } from "./BaseLogger.js";

export class InfoLogger extends BaseLogger {
	constructor() {
		super();
	}

	public log(...messages: string[]) {
		this.print("INFO", "INFO", ...messages);
	}
}
