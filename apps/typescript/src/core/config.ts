// Functional configuration management

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { WorkFloConfig } from '../types/core/config';
import { Result, Ok, Err } from '../types/core/result';

export const defaultConfig: WorkFloConfig = {
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

export const parseConfigLine = (line: string): [string, any] | null => {
  const match = line.match(/^(\w+)=(.+)$/);
  if (!match) return null;
  
  const [, key, value] = match;
  const cleanValue = value.replace(/^["']|["']$/g, '');
  const numValue = Number(cleanValue);
  
  if (!isNaN(numValue)) {
    return [key, numValue];
  } else if (cleanValue === 'true' || cleanValue === 'false') {
    return [key, cleanValue === 'true'];
  } else {
    return [key, cleanValue];
  }
};

export const parseConfigContent = (content: string): Partial<WorkFloConfig> => {
  return content
    .split('\n')
    .map(parseConfigLine)
    .filter(Boolean)
    .reduce((config, entry) => {
      if (!entry) return config;
      const [key, value] = entry;
      if (key in defaultConfig) {
        return { ...config, [key]: value };
      }
      return config;
    }, {} as Partial<WorkFloConfig>);
};

export const loadConfig = (configFile: string): Result<WorkFloConfig> => {
  try {
    if (!existsSync(configFile)) {
      return Ok({ ...defaultConfig });
    }

    const content = readFileSync(configFile, 'utf8');
    const parsed = parseConfigContent(content);
    const merged = { ...defaultConfig, ...parsed };
    
    return Ok(merged);
  } catch (error) {
    return Err(new Error(`Failed to load config: ${error}`));
  }
};

export const formatConfigForSave = (config: WorkFloConfig): string => {
  return Object.entries(config)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return `${key}=${value}`;
      } else if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else {
        return `${key}=${value}`;
      }
    })
    .join('\n');
};

export const saveConfig = (configFile: string, config: WorkFloConfig): Result<void> => {
  try {
    const content = formatConfigForSave(config);
    writeFileSync(configFile, content);
    return Ok(undefined);
  } catch (error) {
    return Err(new Error(`Failed to save config: ${error}`));
  }
};

export const updateConfig = (current: WorkFloConfig, updates: Partial<WorkFloConfig>): WorkFloConfig => {
  return { ...current, ...updates };
};

export const validateConfidenceWeights = (config: WorkFloConfig): Result<WorkFloConfig> => {
  const total = config.CONFIDENCE_WEIGHTS_TEST_PASS + 
               config.CONFIDENCE_WEIGHTS_COVERAGE + 
               config.CONFIDENCE_WEIGHTS_REVIEW + 
               config.CONFIDENCE_WEIGHTS_MUTATION;

  if (total !== 100) {
    return Err(new Error(`Confidence weights must sum to 100, but sum to ${total}`));
  }

  return Ok(config);
};

// Configuration pipeline functions
export const withDefaults = (partial: Partial<WorkFloConfig>): WorkFloConfig => {
  return { ...defaultConfig, ...partial };
};

export const fromFile = (configFile: string) => (): Result<WorkFloConfig> => {
  return loadConfig(configFile);
};

export const toFile = (configFile: string) => (config: WorkFloConfig): Result<WorkFloConfig> => {
  const saveResult = saveConfig(configFile, config);
  return saveResult.success ? Ok(config) : saveResult;
};