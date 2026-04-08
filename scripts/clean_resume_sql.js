const fs = require('fs');
const path = require('path');

const inPath = path.resolve(__dirname, '..', 'tmp', 'resume_data_20260328.sql');
const outPath = path.resolve(__dirname, '..', 'tmp', 'resume_data_20260328.cleaned.sql');
const content = fs.readFileSync(inPath, 'utf8');

let out = '';
let i = 0;
const lines = content.split(/\r?\n/);
let inCopyResume = false;
for (const line of lines) {
  if (!inCopyResume && line.startsWith('COPY public."Resume"')) {
    // remove headshotUrl from header
    const newHeader = line.replace(/, \"headshotUrl\"\) FROM stdin;/, ') FROM stdin;');
    out += newHeader + '\n';
    inCopyResume = true;
    continue;
  }
  if (inCopyResume) {
    if (line === '\\.') {
      inCopyResume = false;
      out += line + '\n';
      continue;
    }
    // data line: remove last tab-separated field
    // handle lines that may contain tabs; split on \t
    const parts = line.split('\t');
    if (parts.length > 0) {
      // drop last element
      parts.pop();
      out += parts.join('\t') + '\n';
    } else {
      out += line + '\n';
    }
    continue;
  }
  out += line + '\n';
}

fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath);