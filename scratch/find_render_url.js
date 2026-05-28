import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\Patrick & Família\\.gemini\\antigravity\\brain\\5b7eec4d-cab0-4227-a9bf-98e432191a17\\.system_generated\\logs\\overview.txt';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  console.log('Total lines:', lines.length);
  
  const matches = lines.filter(line => line.toLowerCase().includes('onrender.com'));
  console.log('Matches count:', matches.length);
  matches.slice(0, 10).forEach((m, idx) => console.log(`${idx}: ${m.trim()}`));
} else {
  console.log('File does not exist');
}
