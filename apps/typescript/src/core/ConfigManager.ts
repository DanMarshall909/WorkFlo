import { existsSync, readFileSync, writeFileSync } from 'fs';

export interface WorkFloConfig {
  PERSONA: string;
  CONFIDENCE_WEIGHTS_TEST_PASS: number;
  CONFIDENCE_WEIGHTS_COVERAGE: number;
  CONFIDENCE_WEIGHTS_REVIEW: number;
  CONFIDENCE_WEIGHTS_MUTATION: number;
  CONFIDENCE_THRESHOLD: number;
  MUTATION_THRESHOLD: number;
  LARGE_CHANGE_THRESHOLD: number;
  SMALL_CHANGE_THRESHOLD: number;
  QUALITY_BASE_SCORE: number;
  QUALITY_TEST_BONUS: number;
  QUALITY_TODO_PENALTY: number;
  QUALITY_LARGE_CHANGE_PENALTY: number;
  QUALITY_SMALL_CHANGE_BONUS: number;
  AI_REVIEW_RETRY_ATTEMPTS: number;
  AI_REVIEW_TIMEOUT: number;
  GIT_CACHE_ENABLED: boolean;
  GIT_CACHE_TTL: number;
}

export class ConfigManager {
  private readonly configFile: string;
  private config: WorkFloConfig;

  private readonly defaults: WorkFloConfig = {
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

  constructor(configFile: string = '.workflo-config') {
    this.configFile = configFile;
    this.config = this.loadConfig();
  }

  getConfig(): WorkFloConfig {
    return { ...this.config };
  }

  get<K extends keyof WorkFloConfig>(key: K): WorkFloConfig[K] {
    return this.config[key];
  }

  set<K extends keyof WorkFloConfig>(key: K, value: WorkFloConfig[K]): void {
    this.config[key] = value;
  }

  save(): void {
    const configContent = Object.entries(this.config)
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

    writeFileSync(this.configFile, configContent);
  }

  reload(): void {
    this.config = this.loadConfig();
  }

  private loadConfig(): WorkFloConfig {
    if (!existsSync(this.configFile)) {
      return { ...this.defaults };
    }

    try {
      const configContent = readFileSync(this.configFile, 'utf8');
      const config = { ...this.defaults };
      
      // Parse bash-style config file
      configContent.split('\n').forEach(line => {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
          const [, key, value] = match;
          if (key in config) {
            const cleanValue = value.replace(/^["']|["']$/g, '');
            const numValue = Number(cleanValue);
            
            if (!isNaN(numValue)) {
              (config as any)[key] = numValue;
            } else if (cleanValue === 'true' || cleanValue === 'false') {
              (config as any)[key] = cleanValue === 'true';
            } else {
              (config as any)[key] = cleanValue;
            }
          }
        }
      });
      
      return config;
    } catch (error) {
      // If config file is corrupted, fall back to defaults
      return { ...this.defaults };
    }
  }

  reset(): void {
    this.config = { ...this.defaults };
  }

  update(updates: Partial<WorkFloConfig>): void {
    Object.assign(this.config, updates);
  }
}