import { existsSync, readFileSync, writeFileSync } from 'fs';

export interface WorkfloConfig {
  persona: string;
  [key: string]: string;
}

export class ConfigService {
  private static readonly CONFIG_FILE = '.workflo-config';
  private static readonly DEFAULT_PERSONA = 'claude';

  static loadConfig(): WorkfloConfig {
    const config: WorkfloConfig = {
      persona: this.DEFAULT_PERSONA
    };

    if (!existsSync(this.CONFIG_FILE)) {
      return config;
    }

    try {
      const content = readFileSync(this.CONFIG_FILE, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.toLowerCase()] = value;
        }
      }

      return config;
    } catch {
      return config;
    }
  }

  static saveConfig(config: WorkfloConfig): void {
    const lines = Object.entries(config).map(([key, value]) => 
      `${key.toUpperCase()}=${value}`
    );
    writeFileSync(this.CONFIG_FILE, lines.join('\n'));
  }

  static getPersona(): string {
    return this.loadConfig().persona;
  }

  static setPersona(persona: string): void {
    const config = this.loadConfig();
    config.persona = persona;
    this.saveConfig(config);
  }

  static validatePersona(persona: string): boolean {
    const personaFile = `${persona.toUpperCase()}.md`;
    return existsSync(personaFile);
  }
}