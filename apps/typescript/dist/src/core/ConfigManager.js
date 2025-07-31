"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs_1 = require("fs");
class ConfigManager {
    constructor(configFile = '.workflo-config') {
        this.defaults = {
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
        this.configFile = configFile;
        this.config = this.loadConfig();
    }
    getConfig() {
        return Object.assign({}, this.config);
    }
    get(key) {
        return this.config[key];
    }
    set(key, value) {
        this.config[key] = value;
    }
    save() {
        const configContent = Object.entries(this.config)
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
        (0, fs_1.writeFileSync)(this.configFile, configContent);
    }
    reload() {
        this.config = this.loadConfig();
    }
    loadConfig() {
        if (!(0, fs_1.existsSync)(this.configFile)) {
            return Object.assign({}, this.defaults);
        }
        try {
            const configContent = (0, fs_1.readFileSync)(this.configFile, 'utf8');
            const config = Object.assign({}, this.defaults);
            // Parse bash-style config file
            configContent.split('\n').forEach(line => {
                const match = line.match(/^(\w+)=(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    if (key in config) {
                        const cleanValue = value.replace(/^["']|["']$/g, '');
                        const numValue = Number(cleanValue);
                        if (!isNaN(numValue)) {
                            config[key] = numValue;
                        }
                        else if (cleanValue === 'true' || cleanValue === 'false') {
                            config[key] = cleanValue === 'true';
                        }
                        else {
                            config[key] = cleanValue;
                        }
                    }
                }
            });
            return config;
        }
        catch (error) {
            // If config file is corrupted, fall back to defaults
            return Object.assign({}, this.defaults);
        }
    }
    reset() {
        this.config = Object.assign({}, this.defaults);
    }
    update(updates) {
        Object.assign(this.config, updates);
    }
}
exports.ConfigManager = ConfigManager;
