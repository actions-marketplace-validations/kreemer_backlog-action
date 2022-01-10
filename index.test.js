const process = require('process');
const cp = require('child_process');
const path = require('path');

test('need auth token', () => {
  const ip = path.join(__dirname, 'index.js');
  expect(() => {cp.execSync(`node ${ip}`, {env: process.env}).toString()}).toThrow();
})
