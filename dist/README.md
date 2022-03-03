```bash
npm install -g browserify uglify-js
browserify . --standalone near-ledger | uglifyjs -o near-ledger.min.js
```
