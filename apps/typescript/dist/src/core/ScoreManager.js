"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreManager = void 0;
const fs_1 = require("fs");
class ScoreManager {
    constructor(scoreFile = '.tdd-scores') {
        this.defaultScores = {
            PERFORMANCE_SCORE: 100,
            QUALITY_SCORE: 100,
            EFFICIENCY_SCORE: 100,
            LLM_EFFICIENCY_SCORE: 100,
            TOTAL_TESTS: 0,
            TOTAL_LINES: 0,
            TEST_RUNS: 0,
            FAILED_RUNS: 0,
            LLM_INTERACTIONS: 0,
            ESTIMATED_TOKENS: 0
        };
        this.scoreFile = scoreFile;
        this.scores = this.loadScores();
    }
    getScores() {
        return Object.assign({}, this.scores);
    }
    getTotalScore() {
        return Math.round((this.scores.PERFORMANCE_SCORE +
            this.scores.QUALITY_SCORE +
            this.scores.EFFICIENCY_SCORE +
            this.scores.LLM_EFFICIENCY_SCORE) / 4);
    }
    calculatePerformanceScore(testPassed, testDurationMs) {
        if (testPassed) {
            this.scores.TEST_RUNS++;
        }
        else {
            this.scores.FAILED_RUNS++;
            this.scores.TEST_RUNS++;
        }
        const failureRate = this.scores.TEST_RUNS > 0
            ? (this.scores.FAILED_RUNS * 100) / this.scores.TEST_RUNS
            : 0;
        const timePenalty = Math.floor(testDurationMs / 100); // Penalty for slow tests
        this.scores.PERFORMANCE_SCORE = Math.max(0, Math.min(100, 100 - failureRate - timePenalty));
    }
    calculateQualityScore(criteria) {
        let currentLines = 0;
        try {
            // Count source code lines (exclude test files and generated files)
            const { execSync } = require('child_process');
            if ((0, fs_1.existsSync)('src')) {
                const linesOutput = execSync('find src -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0', { encoding: 'utf8' });
                currentLines = parseInt(linesOutput.trim()) || 0;
            }
            else {
                const linesOutput = execSync('find . -maxdepth 2 -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | grep -v node_modules | grep -v test | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0', { encoding: 'utf8' });
                currentLines = parseInt(linesOutput.trim()) || 0;
            }
        }
        catch (_a) {
            currentLines = 0;
        }
        const linesPerCriteria = criteria > 0 ? currentLines / criteria : currentLines;
        const complexityPenalty = Math.floor(linesPerCriteria / 50); // Penalty for verbose implementations
        this.scores.QUALITY_SCORE = Math.max(0, Math.min(100, 100 - complexityPenalty));
        this.scores.TOTAL_LINES = currentLines;
    }
    calculateEfficiencyScore(criteria) {
        let currentTests = 0;
        try {
            const { execSync } = require('child_process');
            if ((0, fs_1.existsSync)('test') || (0, fs_1.existsSync)('tests') || (0, fs_1.existsSync)('src/test')) {
                const testsOutput = execSync('find . -name "*.test.*" -o -name "*.spec.*" -o -name "*.bats" | xargs grep -c "test\\|it\\|should" 2>/dev/null | awk \'{sum+=$1} END {print sum+0}\'', { encoding: 'utf8' });
                currentTests = parseInt(testsOutput.trim()) || 0;
            }
        }
        catch (_a) {
            currentTests = 0;
        }
        const testsPerCriteria = criteria > 0 ? currentTests / criteria : currentTests;
        let efficiencyBonus = 0;
        // Bonus for having exactly the right number of tests
        if (testsPerCriteria >= 1 && testsPerCriteria <= 3) {
            efficiencyBonus = 20;
        }
        else if (testsPerCriteria >= 4 && testsPerCriteria <= 6) {
            efficiencyBonus = 10;
        }
        const efficiencyPenalty = testsPerCriteria > 6 ? (testsPerCriteria - 6) * 5 : 0;
        this.scores.EFFICIENCY_SCORE = Math.max(0, Math.min(100, 80 + efficiencyBonus - efficiencyPenalty));
        this.scores.TOTAL_TESTS = currentTests;
    }
    calculateLlmEfficiencyScore(outputTokens, phase) {
        this.scores.LLM_INTERACTIONS++;
        this.scores.ESTIMATED_TOKENS += outputTokens;
        // Phase-specific verbosity penalties
        let verbosityPenalty = 0;
        switch (phase) {
            case 'RED':
            case 'GREEN':
                if (outputTokens > 200) {
                    verbosityPenalty = outputTokens - 200;
                }
                break;
            case 'COVER':
                if (outputTokens > 500) {
                    verbosityPenalty = Math.floor((outputTokens - 500) / 2);
                }
                break;
            default:
                if (outputTokens > 300) {
                    verbosityPenalty = Math.floor((outputTokens - 300) / 3);
                }
                break;
        }
        let verbosityScore = 100;
        if (verbosityPenalty > 0) {
            verbosityScore = 100 - Math.floor(verbosityPenalty / 10);
        }
        // Bonus for extremely concise output
        if (outputTokens < 100) {
            verbosityScore += 20;
        }
        this.scores.LLM_EFFICIENCY_SCORE = Math.max(0, Math.min(100, verbosityScore));
    }
    save() {
        const scoresContent = Object.entries(this.scores)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        (0, fs_1.writeFileSync)(this.scoreFile, scoresContent);
    }
    reset() {
        this.scores = Object.assign({}, this.defaultScores);
        this.save();
    }
    loadScores() {
        if (!(0, fs_1.existsSync)(this.scoreFile)) {
            return Object.assign({}, this.defaultScores);
        }
        try {
            const scoresContent = (0, fs_1.readFileSync)(this.scoreFile, 'utf8');
            const scores = {};
            scoresContent.split('\n').forEach(line => {
                const match = line.match(/^(\w+)=(.+)$/);
                if (match) {
                    const [, key, value] = match;
                    scores[key] = Number(value) || 0;
                }
            });
            // Merge with defaults to ensure all fields exist
            return Object.assign(Object.assign({}, this.defaultScores), scores);
        }
        catch (_a) {
            return Object.assign({}, this.defaultScores);
        }
    }
    displayScores() {
        const totalScore = this.getTotalScore();
        console.log('');
        console.log('🎮 GAMIFICATION SCORES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`⚡ Performance: ${this.scores.PERFORMANCE_SCORE}/100 (test speed & reliability)`);
        console.log(`🎯 Code Quality: ${this.scores.QUALITY_SCORE}/100 (minimal, clean implementation)`);
        console.log(`🧪 Test Efficiency: ${this.scores.EFFICIENCY_SCORE}/100 (optimal test coverage)`);
        console.log(`🤖 LLM Efficiency: ${this.scores.LLM_EFFICIENCY_SCORE}/100 (output verbosity optimization)`);
        console.log(`📊 Overall Score: ${totalScore}/100`);
        console.log('');
        console.log(`📈 Metrics: ${this.scores.TOTAL_TESTS} tests, ${this.scores.TOTAL_LINES} lines, ${this.scores.TEST_RUNS} runs`);
        console.log(`🔤 Script Output: ${this.scores.LLM_INTERACTIONS} commands, ~${this.scores.ESTIMATED_TOKENS} output tokens`);
        console.log('');
    }
}
exports.ScoreManager = ScoreManager;
