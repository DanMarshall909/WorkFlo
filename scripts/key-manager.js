#!/usr/bin/env node

/**
 * Secure API Key Manager for Anchor Development Environment
 * Handles encrypted storage and retrieval of sensitive API keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const KEY_FILE = path.join(__dirname, '.encrypted-keys');
const SALT_FILE = path.join(__dirname, '.key-salt');

class SecureKeyManager {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyDerivationIterations = 100000;
    }

    async promptPassword(prompt) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            // Check if stdin is a TTY before setting raw mode
            if (process.stdin.isTTY) {
                // Hide password input in TTY environments
                process.stdout.write(prompt);
                process.stdin.setRawMode(true);
                
                let password = '';
                process.stdin.on('data', char => {
                    char = char.toString();
                    
                    if (char === '\r' || char === '\n') {
                        process.stdin.setRawMode(false);
                        rl.close();
                        process.stdout.write('\n');
                        resolve(password);
                    } else if (char === '\u0003') {
                        // Ctrl+C
                        process.stdout.write('\n');
                        process.exit(0);
                    } else if (char === '\u007f') {
                        // Backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else {
                        password += char;
                        process.stdout.write('*');
                    }
                });
            } else {
                // Fallback for non-TTY environments (like scripts)
                rl.question(prompt, answer => {
                    rl.close();
                    resolve(answer.trim());
                });
            }
        });
    }

    async promptInput(prompt) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(prompt, answer => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }

    generateSalt() {
        return crypto.randomBytes(32);
    }

    deriveKey(password, salt) {
        return crypto.pbkdf2Sync(password, salt, this.keyDerivationIterations, 32, 'sha256');
    }

    encrypt(data, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData, key) {
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    async saveKeys(keys, password) {
        try {
            const salt = this.generateSalt();
            const derivedKey = this.deriveKey(password, salt);
            const encryptedData = this.encrypt(keys, derivedKey);
            
            // Save salt separately
            fs.writeFileSync(SALT_FILE, salt);
            
            // Save encrypted keys
            fs.writeFileSync(KEY_FILE, JSON.stringify(encryptedData, null, 2));
            
            // Set restrictive permissions
            fs.chmodSync(KEY_FILE, 0o600);
            fs.chmodSync(SALT_FILE, 0o600);
            
            console.log('✅ Keys encrypted and saved securely');
            return true;
        } catch (error) {
            console.error('❌ Error saving keys:', error.message);
            return false;
        }
    }

    async loadKeys(password) {
        try {
            if (!fs.existsSync(KEY_FILE) || !fs.existsSync(SALT_FILE)) {
                return null;
            }
            
            const salt = fs.readFileSync(SALT_FILE);
            const encryptedData = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
            const derivedKey = this.deriveKey(password, salt);
            
            const keys = this.decrypt(encryptedData, derivedKey);
            return keys;
        } catch (error) {
            console.error('❌ Error loading keys (wrong password?):', error.message);
            return null;
        }
    }

    async setupKeys() {
        console.log('🔐 Anchor Development Environment - API Key Setup');
        console.log('================================================\n');
        
        // Check if keys already exist
        if (fs.existsSync(KEY_FILE)) {
            const update = await this.promptInput('Encrypted keys already exist. Update them? (y/N): ');
            if (update.toLowerCase() !== 'y') {
                console.log('🔑 Using existing encrypted keys');
                return await this.loadExistingKeys();
            }
        }
        
        console.log('📝 Setting up required API keys for development...\n');
        
        // Collect required keys
        const keys = {};
        
        // Claude API Key
        console.log('1. Claude API Key (for intelligent drift detection)');
        console.log('   Get one from: https://console.anthropic.com/');
        const claudeKey = await this.promptInput('   Enter Claude API key: ');
        if (claudeKey) {
            keys.CLAUDE_API_KEY = claudeKey;
        }
        
        console.log('\n2. GitHub Personal Access Token (optional, for enhanced GitHub integration)');
        console.log('   Create one at: https://github.com/settings/tokens');
        const githubToken = await this.promptInput('   Enter GitHub token (optional): ');
        if (githubToken) {
            keys.GITHUB_TOKEN = githubToken;
        }
        
        if (Object.keys(keys).length === 0) {
            console.log('❌ No keys provided. Exiting setup.');
            return false;
        }
        
        console.log('\n🔒 Setting up encryption...');
        const password = await this.promptPassword('Enter encryption password: ');
        
        if (!password || password.length < 8) {
            console.log('❌ Password must be at least 8 characters long');
            return false;
        }
        
        const confirmPassword = await this.promptPassword('Confirm encryption password: ');
        
        if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            return false;
        }
        
        return await this.saveKeys(keys, password);
    }

    async loadExistingKeys() {
        const password = await this.promptPassword('Enter encryption password: ');
        return await this.loadKeys(password);
    }

    async exportEnvironmentVariables() {
        const keys = await this.loadExistingKeys();
        
        if (!keys) {
            console.log('❌ Could not load keys');
            return false;
        }
        
        console.log('\n🌍 Setting environment variables...');
        
        // Set environment variables
        Object.entries(keys).forEach(([key, value]) => {
            process.env[key] = value;
            console.log(`✅ ${key} set in environment`);
        });
        
        return true;
    }
}

// CLI Interface
async function main() {
    const keyManager = new SecureKeyManager();
    
    const args = process.argv.slice(2);
    const command = args[0] || 'setup';
    
    switch (command) {
        case 'setup':
            await keyManager.setupKeys();
            break;
            
        case 'load':
            const keys = await keyManager.loadExistingKeys();
            if (keys) {
                console.log('✅ Keys loaded successfully');
                console.log('Available keys:', Object.keys(keys).join(', '));
            }
            break;
            
        case 'export':
            await keyManager.exportEnvironmentVariables();
            break;
            
        case 'help':
        default:
            console.log('🔐 Anchor Key Manager');
            console.log('Usage: node key-manager.js [command]');
            console.log('');
            console.log('Commands:');
            console.log('  setup   - Set up encrypted API keys');
            console.log('  load    - Load and verify existing keys');
            console.log('  export  - Export keys as environment variables');
            console.log('  help    - Show this help message');
            break;
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = SecureKeyManager;