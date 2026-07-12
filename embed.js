const fs = require('fs');
const txt = fs.readFileSync('Projectssss/Gridmin-RL.txt', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const scriptTag = `<script type="text/template" id="gridmind-content">\n${txt}\n</script>\n<script src="js/main.js"></script>`;
fs.writeFileSync('index.html', html.replace('<script src="js/main.js"></script>', scriptTag));
console.log('Successfully embedded text into index.html');
