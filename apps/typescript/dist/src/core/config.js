"use strict";
// Functional configuration management
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFile = exports.fromFile = exports.withDefaults = exports.validateConfidenceWeights = exports.updateConfig = exports.saveConfig = exports.formatConfigForSave = exports.loadConfig = exports.parseConfigContent = exports.parseConfigLine = exports.defaultConfig = void 0;
const fs_1 = require("fs");
const result_1 = require("../types/core/result");
exports.defaultConfig = {
    PERSONA: 'claude',
    CONFIDENCE_WEIGHTS_TEST_PASS: 30,
    CONFIDENCE_WEIGHTS_COVERAGE: 25,
    CONFIDENCE_WEIGHTS_REVIEW: 25,
    CONFIDENCE_WEIGHTS_MUTATION: 20,
    CONFIDENCE_THRESHOLD: 90,
    MUTATION_THRESHOLD: 85,
    LARGE_CHANGE_THRESHOLD: 100,
    SMALL_CHANGE_THRESHOLD: 20,
    QUALITY_BASE_SCORE: 85,
    QUALITY_TEST_BONUS: 5,
    QUALITY_TODO_PENALTY: 10,
    QUALITY_LARGE_CHANGE_PENALTY: 15,
    QUALITY_SMALL_CHANGE_BONUS: 5,
    AI_REVIEW_RETRY_ATTEMPTS: 3,
    AI_REVIEW_TIMEOUT: 30,
    GIT_CACHE_ENABLED: true,
    GIT_CACHE_TTL: 300
};
const parseConfigLine = (line) => {
    const match = line.match(/^(\w+)=(.+)$/);
    if (!match)
        return null;
    const [, key, value] = match;
    const cleanValue = value.replace(/^["']|["']$/g, '');
    const numValue = Number(cleanValue);
    if (!isNaN(numValue)) {
        return [key, numValue];
    }
    else if (cleanValue === 'true' || cleanValue === 'false') {
        return [key, cleanValue === 'true'];
    }
    else {
        return [key, cleanValue];
    }
};
exports.parseConfigLine = parseConfigLine;
const parseConfigContent = (content) => {
    return content
        .split('\n')
        .map(exports.parseConfigLine)
        .filter(Boolean)
        .reduce((config, entry) => {
        if (!entry)
            return config;
        const [key, value] = entry;
        if (key in exports.defaultConfig) {
            return Object.assign(Object.assign({}, config), { [key]: value });
        }
        return config;
    }, {});
};
exports.parseConfigContent = parseConfigContent;
const loadConfig = (configFile) => {
    try {
        if (!(0, fs_1.existsSync)(configFile)) {
            return (0, result_1.Ok)(Object.assign({}, exports.defaultConfig));
        }
        const content = (0, fs_1.readFileSync)(configFile, 'utf8');
        const parsed = (0, exports.parseConfigContent)(content);
        const merged = Object.assign(Object.assign({}, exports.defaultConfig), parsed);
        return (0, result_1.Ok)(merged);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to load config: ${error}`));
    }
};
exports.loadConfig = loadConfig;
const formatConfigForSave = (config) => {
    return Object.entries(config)
        .map(([key, value]) => {
        if (typeof value === 'boolean') {
            return `${key}=${value}`;
        }
        else if (typeof value === 'string') {
            return `${key}="${value}"`;
        }
        else {
            return `${key}=${value}`;
        }
    })
        .join('\n');
};
exports.formatConfigForSave = formatConfigForSave;
const saveConfig = (configFile, config) => {
    try {
        const content = (0, exports.formatConfigForSave)(config);
        (0, fs_1.writeFileSync)(configFile, content);
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to save config: ${error}`));
    }
};
exports.saveConfig = saveConfig;
const updateConfig = (current, updates) => {
    return Object.assign(Object.assign({}, current), updates);
};
exports.updateConfig = updateConfig;
const validateConfidenceWeights = (config) => {
    const total = config.CONFIDENCE_WEIGHTS_TEST_PASS +
        config.CONFIDENCE_WEIGHTS_COVERAGE +
        config.CONFIDENCE_WEIGHTS_REVIEW +
        config.CONFIDENCE_WEIGHTS_MUTATION;
    if (total !== 100) {
        return (0, result_1.Err)(new Error(`Confidence weights must sum to 100, but sum to ${total}`));
    }
    return (0, result_1.Ok)(config);
};
exports.validateConfidenceWeights = validateConfidenceWeights;
// Configuration pipeline functions
const withDefaults = (partial) => {
    return Object.assign(Object.assign({}, exports.defaultConfig), partial);
};
exports.withDefaults = withDefaults;
const fromFile = (configFile) => () => {
    return (0, exports.loadConfig)(configFile);
};
exports.fromFile = fromFile;
const toFile = (configFile) => (config) => {
    const saveResult = (0, exports.saveConfig)(configFile, config);
    return saveResult.success ? (0, result_1.Ok)(config) : saveResult;
};
exports.toFile = toFile;
