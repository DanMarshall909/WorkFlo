import * as fs from 'fs';
import * as path from 'path';

// Global test setup
beforeEach(() => {
  // Clean up state files before each test
  const stateFiles = [
    '.auto-workflow-state.json',
    path.join(__dirname, '..', '.auto-workflow-state.json'),
    path.join(process.cwd(), '.auto-workflow-state.json')
  ];
  
  stateFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

afterAll(() => {
  // Final cleanup
  const stateFiles = [
    '.auto-workflow-state.json',
    path.join(__dirname, '..', '.auto-workflow-state.json'),
    path.join(process.cwd(), '.auto-workflow-state.json')
  ];
  
  stateFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});