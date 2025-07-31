"use strict";
// Result type for functional error handling
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErr = exports.isOk = exports.unwrapOr = exports.unwrap = exports.mapError = exports.flatMap = exports.map = exports.Err = exports.Ok = void 0;
const Ok = (data) => ({ success: true, data });
exports.Ok = Ok;
const Err = (error) => ({ success: false, error });
exports.Err = Err;
// Result utility functions
const map = (result, fn) => {
    return result.success ? (0, exports.Ok)(fn(result.data)) : result;
};
exports.map = map;
const flatMap = (result, fn) => {
    return result.success ? fn(result.data) : result;
};
exports.flatMap = flatMap;
const mapError = (result, fn) => {
    return result.success ? result : (0, exports.Err)(fn(result.error));
};
exports.mapError = mapError;
const unwrap = (result) => {
    if (result.success) {
        return result.data;
    }
    throw result.error;
};
exports.unwrap = unwrap;
const unwrapOr = (result, defaultValue) => {
    return result.success ? result.data : defaultValue;
};
exports.unwrapOr = unwrapOr;
const isOk = (result) => {
    return result.success;
};
exports.isOk = isOk;
const isErr = (result) => {
    return !result.success;
};
exports.isErr = isErr;
