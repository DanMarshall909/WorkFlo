"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["SUCCESS"] = 3] = "SUCCESS";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["SCORE"] = 5] = "SCORE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(config) {
        this.colors = {
            RED: '\x1b[0;31m',
            GREEN: '\x1b[0;32m',
            YELLOW: '\x1b[1;33m',
            BLUE: '\x1b[0;34m',
            PURPLE: '\x1b[0;35m',
            CYAN: '\x1b[0;36m',
            NC: '\x1b[0m'
        };
        this.config = Object.assign({ level: LogLevel.INFO, debugMode: process.env.TDD_DEBUG === '1', verboseOutput: process.env.TDD_VERBOSE === '1', colors: true }, config);
    }
    error(message) {
        this.log(LogLevel.ERROR, message, 'ERROR', this.colors.RED);
        process.exit(1);
    }
    success(message) {
        const prefix = this.config.verboseOutput || this.config.debugMode ? 'SUCCESS' : '✅';
        this.log(LogLevel.SUCCESS, message, prefix, this.colors.GREEN);
    }
    warn(message) {
        const prefix = this.config.verboseOutput || this.config.debugMode ? 'WARNING' : '⚠️';
        this.log(LogLevel.WARN, message, prefix, this.colors.YELLOW);
    }
    info(message) {
        const prefix = this.config.verboseOutput || this.config.debugMode ? 'INFO' : 'ℹ️';
        this.log(LogLevel.INFO, message, prefix, this.colors.BLUE);
    }
    score(message) {
        this.log(LogLevel.SCORE, message, 'SCORE', this.colors.PURPLE);
    }
    debug(message) {
        if (this.config.debugMode) {
            this.log(LogLevel.DEBUG, message, 'DEBUG', this.colors.CYAN, true);
        }
    }
    log(level, message, prefix, color, useStderr = false) {
        if (level > this.config.level && level !== LogLevel.DEBUG) {
            return;
        }
        const colorizedPrefix = this.config.colors ? `${color}[${prefix}]${this.colors.NC}` : `[${prefix}]`;
        const output = this.config.verboseOutput || this.config.debugMode || level === LogLevel.SCORE
            ? `${colorizedPrefix} ${message}`
            : `${colorizedPrefix} ${message}`;
        if (useStderr) {
            console.error(output);
        }
        else {
            console.log(output);
        }
    }
    setLevel(level) {
        this.config.level = level;
    }
    setDebugMode(enabled) {
        this.config.debugMode = enabled;
    }
    setVerboseOutput(enabled) {
        this.config.verboseOutput = enabled;
    }
}
exports.Logger = Logger;
// Singleton instance for global use
exports.logger = new Logger();
