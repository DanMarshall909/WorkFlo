"use strict";
// Functional logging utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.logError = exports.withLogging = exports.debug = exports.score = exports.info = exports.warn = exports.success = exports.error = exports.log = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["SUCCESS"] = 3] = "SUCCESS";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["SCORE"] = 5] = "SCORE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
const colors = {
    RED: '\x1b[0;31m',
    GREEN: '\x1b[0;32m',
    YELLOW: '\x1b[1;33m',
    BLUE: '\x1b[0;34m',
    PURPLE: '\x1b[0;35m',
    CYAN: '\x1b[0;36m',
    NC: '\x1b[0m'
};
const createLogConfig = () => ({
    level: LogLevel.INFO,
    debug: process.env.TDD_DEBUG === '1',
    verbose: process.env.TDD_VERBOSE === '1',
    colors: true
});
const formatMessage = (config, level, message, prefix, color) => {
    const colorizedPrefix = config.colors ? `${color}[${prefix}]${colors.NC}` : `[${prefix}]`;
    return config.verbose || config.debug || level === LogLevel.SCORE
        ? `${colorizedPrefix} ${message}`
        : `${colorizedPrefix} ${message}`;
};
const shouldLog = (config, level) => {
    return level <= config.level || level === LogLevel.DEBUG && config.debug;
};
// Pure logging functions
const log = (config, level, message, prefix, color, useStderr = false) => {
    if (!shouldLog(config, level) && level !== LogLevel.DEBUG)
        return;
    const formatted = formatMessage(config, level, message, prefix, color);
    if (useStderr) {
        console.error(formatted);
    }
    else {
        console.log(formatted);
    }
};
exports.log = log;
// Specialized logging functions
const error = (message, config = createLogConfig()) => {
    (0, exports.log)(config, LogLevel.ERROR, message, 'ERROR', colors.RED);
    process.exit(1);
};
exports.error = error;
const success = (message, config = createLogConfig()) => {
    const prefix = config.verbose || config.debug ? 'SUCCESS' : '✅';
    (0, exports.log)(config, LogLevel.SUCCESS, message, prefix, colors.GREEN);
};
exports.success = success;
const warn = (message, config = createLogConfig()) => {
    const prefix = config.verbose || config.debug ? 'WARNING' : '⚠️';
    (0, exports.log)(config, LogLevel.WARN, message, prefix, colors.YELLOW);
};
exports.warn = warn;
const info = (message, config = createLogConfig()) => {
    const prefix = config.verbose || config.debug ? 'INFO' : 'ℹ️';
    (0, exports.log)(config, LogLevel.INFO, message, prefix, colors.BLUE);
};
exports.info = info;
const score = (message, config = createLogConfig()) => {
    (0, exports.log)(config, LogLevel.SCORE, message, 'SCORE', colors.PURPLE);
};
exports.score = score;
const debug = (message, config = createLogConfig()) => {
    if (config.debug) {
        (0, exports.log)(config, LogLevel.DEBUG, message, 'DEBUG', colors.CYAN, true);
    }
};
exports.debug = debug;
// Functional composition helpers
const withLogging = (fn, logMessage, level = 'info') => (...args) => {
    const logFn = level === 'info' ? exports.info : level === 'debug' ? exports.debug : exports.success;
    logFn(logMessage);
    return fn(...args);
};
exports.withLogging = withLogging;
const logError = (err, config = createLogConfig()) => {
    var _a;
    if ((_a = err.name) === null || _a === void 0 ? void 0 : _a.includes('WorkFlo')) {
        (0, exports.log)(config, LogLevel.ERROR, err.message, 'ERROR', colors.RED);
    }
    else {
        (0, exports.log)(config, LogLevel.ERROR, `Unexpected error: ${err.message}`, 'ERROR', colors.RED);
        if (config.debug) {
            (0, exports.log)(config, LogLevel.DEBUG, `Stack: ${err.stack}`, 'DEBUG', colors.CYAN, true);
        }
    }
};
exports.logError = logError;
// Logger class for compatibility
class Logger {
    constructor(config = createLogConfig()) {
        this.config = config;
    }
    error(message) {
        return (0, exports.error)(message, this.config);
    }
    warn(message) {
        (0, exports.warn)(message, this.config);
    }
    info(message) {
        (0, exports.info)(message, this.config);
    }
    success(message) {
        (0, exports.success)(message, this.config);
    }
    debug(message) {
        (0, exports.debug)(message, this.config);
    }
    score(message) {
        (0, exports.score)(message, this.config);
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
