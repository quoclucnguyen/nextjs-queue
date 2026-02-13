/**
 * Simple logger utility
 * In production, consider using a structured logging library like pino or winston
 */
export class Logger {
  private static formatMessage(
    level: string,
    message: string,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : "";
    return `[${timestamp}] ${level.toUpperCase()} ${prefix} ${message}`;
  }

  static log(message: string, context?: string): void {
    console.log(this.formatMessage("info", message, context));
  }

  static debug(message: string, context?: string): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  static warn(message: string, context?: string): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  static error(message: string, context?: string): void {
    console.error(this.formatMessage("error", message, context));
  }
}

/**
 * Instance-based Logger for class-based usage
 * Matches the NestJS Logger interface
 */
export class InstanceLogger {
  constructor(private readonly context: string) {}

  log(message: string): void {
    Logger.log(message, this.context);
  }

  debug(message: string): void {
    Logger.debug(message, this.context);
  }

  warn(message: string): void {
    Logger.warn(message, this.context);
  }

  error(message: string, trace?: string): void {
    const formattedMessage = trace
      ? `${message}\n${trace}`
      : message;
    Logger.error(formattedMessage, this.context);
  }
}
