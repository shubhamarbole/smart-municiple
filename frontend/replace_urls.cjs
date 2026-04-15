const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('http://localhost:5000')) {
        let newContent = content.replace(/['`]http:\/\/localhost:5000([^'`]*)['`]/g, '`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}$1`');
        fs.writeFileSync(fullPath, newContent);
      }
    }
  });
}
replaceInDir('c:/Users/shubham arbole/OneDrive/Desktop/internship project/frontend/src');
