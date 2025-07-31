"use strict";
// Functional scoring and gamification system
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokenUsage = exports.withLlmTracking = exports.withEfficiencyTracking = exports.withQualityTracking = exports.withPerformanceTracking = exports.updateScores = exports.displayScores = exports.calculateLlmEfficiencyScore = exports.calculateEfficiencyScore = exports.countTests = exports.calculateQualityScore = exports.countSourceLines = exports.calculatePerformanceScore = exports.getTotalScore = exports.saveScores = exports.formatScoresForSave = exports.loadScores = exports.parseScoresContent = exports.defaultScores = void 0;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const result_1 = require("../types/core/result");
exports.defaultScores = {
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
const parseScoresContent = (content) => {
    const scores = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^(\w+)=(.+)$/);
        if (match) {
            const [, key, value] = match;
            scores[key] = Number(value) || 0;
        }
    });
    return scores;
};
exports.parseScoresContent = parseScoresContent;
const loadScores = (scoreFile) => {
    try {
        if (!(0, fs_1.existsSync)(scoreFile)) {
            return (0, result_1.Ok)(Object.assign({}, exports.defaultScores));
        }
        const content = (0, fs_1.readFileSync)(scoreFile, 'utf8');
        const parsed = (0, exports.parseScoresContent)(content);
        const merged = Object.assign(Object.assign({}, exports.defaultScores), parsed);
        return (0, result_1.Ok)(merged);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to load scores: ${error}`));
    }
};
exports.loadScores = loadScores;
const formatScoresForSave = (scores) => {
    return Object.entries(scores)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
};
exports.formatScoresForSave = formatScoresForSave;
const saveScores = (scoreFile, scores) => {
    try {
        const content = (0, exports.formatScoresForSave)(scores);
        (0, fs_1.writeFileSync)(scoreFile, content);
        return (0, result_1.Ok)(undefined);
    }
    catch (error) {
        return (0, result_1.Err)(new Error(`Failed to save scores: ${error}`));
    }
};
exports.saveScores = saveScores;
const getTotalScore = (scores) => {
    return Math.round((scores.PERFORMANCE_SCORE +
        scores.QUALITY_SCORE +
        scores.EFFICIENCY_SCORE +
        scores.LLM_EFFICIENCY_SCORE) / 4);
};
exports.getTotalScore = getTotalScore;
// Performance score calculation
const calculatePerformanceScore = (scores, testPassed, testDurationMs) => {
    const updatedScores = Object.assign(Object.assign({}, scores), { TEST_RUNS: scores.TEST_RUNS + 1, FAILED_RUNS: testPassed ? scores.FAILED_RUNS : scores.FAILED_RUNS + 1 });
    const failureRate = updatedScores.TEST_RUNS > 0
        ? (updatedScores.FAILED_RUNS * 100) / updatedScores.TEST_RUNS
        : 0;
    const timePenalty = Math.floor(testDurationMs / 100); // Penalty for slow tests
    const performanceScore = Math.max(0, Math.min(100, 100 - failureRate - timePenalty));
    return Object.assign(Object.assign({}, updatedScores), { PERFORMANCE_SCORE: performanceScore });
};
exports.calculatePerformanceScore = calculatePerformanceScore;
// Quality score calculation  
const countSourceLines = () => {
    try {
        if ((0, fs_1.existsSync)('src')) {
            const linesOutput = (0, child_process_1.execSync)('find src -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0', { encoding: 'utf8' });
            return parseInt(linesOutput.trim()) || 0;
        }
        else {
            const linesOutput = (0, child_process_1.execSync)('find . -maxdepth 2 -name "*.ts" -o -name "*.js" -o -name "*.cs" -o -name "*.sh" | grep -v node_modules | grep -v test | xargs wc -l 2>/dev/null | tail -1 | awk \'{print $1}\' || echo 0', { encoding: 'utf8' });
            return parseInt(linesOutput.trim()) || 0;
        }
    }
    catch (_a) {
        return 0;
    }
};
exports.countSourceLines = countSourceLines;
const calculateQualityScore = (scores, criteria) => {
    const currentLines = (0, exports.countSourceLines)();
    const linesPerCriteria = criteria > 0 ? currentLines / criteria : currentLines;
    const complexityPenalty = Math.floor(linesPerCriteria / 50); // Penalty for verbose implementations
    const qualityScore = Math.max(0, Math.min(100, 100 - complexityPenalty));
    return Object.assign(Object.assign({}, scores), { QUALITY_SCORE: qualityScore, TOTAL_LINES: currentLines });
};
exports.calculateQualityScore = calculateQualityScore;
// Efficiency score calculation
const countTests = () => {
    try {
        if ((0, fs_1.existsSync)('test') || (0, fs_1.existsSync)('tests') || (0, fs_1.existsSync)('src/test')) {
            const testsOutput = (0, child_process_1.execSync)('find . -name "*.test.*" -o -name "*.spec.*" -o -name "*.bats" | xargs grep -c "test\\|it\\|should" 2>/dev/null | awk \'{sum+=$1} END {print sum+0}\'', { encoding: 'utf8' });
            return parseInt(testsOutput.trim()) || 0;
        }
    }
    catch (_a) {
        return 0;
    }
    return 0;
};
exports.countTests = countTests;
const calculateEfficiencyScore = (scores, criteria) => {
    const currentTests = (0, exports.countTests)();
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
    const efficiencyScore = Math.max(0, Math.min(100, 80 + efficiencyBonus - efficiencyPenalty));
    return Object.assign(Object.assign({}, scores), { EFFICIENCY_SCORE: efficiencyScore, TOTAL_TESTS: currentTests });
};
exports.calculateEfficiencyScore = calculateEfficiencyScore;
// LLM efficiency score calculation
const calculateLlmEfficiencyScore = (scores, outputTokens, phase) => {
    const updatedScores = Object.assign(Object.assign({}, scores), { LLM_INTERACTIONS: scores.LLM_INTERACTIONS + 1, ESTIMATED_TOKENS: scores.ESTIMATED_TOKENS + outputTokens });
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
    const llmEfficiencyScore = Math.max(0, Math.min(100, verbosityScore));
    return Object.assign(Object.assign({}, updatedScores), { LLM_EFFICIENCY_SCORE: llmEfficiencyScore });
};
exports.calculateLlmEfficiencyScore = calculateLlmEfficiencyScore;
// Display functions
const displayScores = (scores) => {
    const totalScore = (0, exports.getTotalScore)(scores);
    console.log('');
    console.log('🎮 GAMIFICATION SCORES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⚡ Performance: ${scores.PERFORMANCE_SCORE}/100 (test speed & reliability)`);
    console.log(`🎯 Code Quality: ${scores.QUALITY_SCORE}/100 (minimal, clean implementation)`);
    console.log(`🧪 Test Efficiency: ${scores.EFFICIENCY_SCORE}/100 (optimal test coverage)`);
    console.log(`🤖 LLM Efficiency: ${scores.LLM_EFFICIENCY_SCORE}/100 (output verbosity optimization)`);
    console.log(`📊 Overall Score: ${totalScore}/100`);
    console.log('');
    console.log(`📈 Metrics: ${scores.TOTAL_TESTS} tests, ${scores.TOTAL_LINES} lines, ${scores.TEST_RUNS} runs`);
    console.log(`🔤 Script Output: ${scores.LLM_INTERACTIONS} commands, ~${scores.ESTIMATED_TOKENS} output tokens`);
    console.log('');
};
exports.displayScores = displayScores;
// Functional composition helpers
const updateScores = (scoreFile, updateFn) => () => {
    const loadResult = (0, exports.loadScores)(scoreFile);
    if (!loadResult.success)
        return loadResult;
    const updatedScores = updateFn(loadResult.data);
    const saveResult = (0, exports.saveScores)(scoreFile, updatedScores);
    return saveResult.success ? (0, result_1.Ok)(updatedScores) : saveResult;
};
exports.updateScores = updateScores;
const withPerformanceTracking = (scoreFile, testPassed, testDurationMs) => (0, exports.updateScores)(scoreFile, scores => (0, exports.calculatePerformanceScore)(scores, testPassed, testDurationMs));
exports.withPerformanceTracking = withPerformanceTracking;
const withQualityTracking = (scoreFile, criteria) => (0, exports.updateScores)(scoreFile, scores => (0, exports.calculateQualityScore)(scores, criteria));
exports.withQualityTracking = withQualityTracking;
const withEfficiencyTracking = (scoreFile, criteria) => (0, exports.updateScores)(scoreFile, scores => (0, exports.calculateEfficiencyScore)(scores, criteria));
exports.withEfficiencyTracking = withEfficiencyTracking;
const withLlmTracking = (scoreFile, outputTokens, phase) => (0, exports.updateScores)(scoreFile, scores => (0, exports.calculateLlmEfficiencyScore)(scores, outputTokens, phase));
exports.withLlmTracking = withLlmTracking;
const estimateTokenUsage = (output) => {
    // Rough estimation: ~4 characters per token
    return Math.ceil(output.length / 4);
};
exports.estimateTokenUsage = estimateTokenUsage;
