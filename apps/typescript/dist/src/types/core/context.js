"use strict";
// Application context types
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["SUCCESS"] = 3] = "SUCCESS";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["SCORE"] = 5] = "SCORE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
