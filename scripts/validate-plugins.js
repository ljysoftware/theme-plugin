const yaml = require('js-yaml');
const fs = require('fs');

const SPEC_FILE = 'pluginspec.yml';
const REQUIRED_FIELDS = ['name', 'version', 'assets', 'description'];

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, name: 'eval()' },
  { pattern: /new\s+Function\s*\(/, name: 'new Function()' },
  { pattern: /document\.write/, name: 'document.write' },
  { pattern: /innerHTML\s*=/, name: 'innerHTML assignment' },
  { pattern: /fetch\s*\(/, name: 'fetch() - external requests' },
  { pattern: /XMLHttpRequest/, name: 'XMLHttpRequest' },
  { pattern: /localStorage/, name: 'localStorage access' },
  { pattern: /sessionStorage/, name: 'sessionStorage access' },
  { pattern: /document\.cookie/, name: 'cookie access' },
  { pattern: /<script/, name: 'script tag injection' },
];

let hasError = false;
let hasWarning = false;

function log(type, ...args) {
  const icons = { ok: '[OK]', error: '[ERROR]', warn: '[WARN]', info: '[INFO]' };
  console.log(icons[type] || '', ...args);
}

function loadSpec() {
  console.log('\nValidating YAML syntax...');
  try {
    const doc = yaml.load(fs.readFileSync(SPEC_FILE, 'utf8'));
    log('ok', 'YAML syntax is valid');
    log('info', `Found ${doc.plugins.length} plugin(s)`);
    return doc;
  } catch (e) {
    log('error', 'YAML syntax error:', e.message);
    process.exit(1);
  }
}

function validateSchema(doc) {
  console.log('\nValidating plugin schema...');

  doc.plugins.forEach((plugin, index) => {
    const name = plugin.name || `plugin[${index}]`;

    REQUIRED_FIELDS.forEach((field) => {
      if (!plugin[field]) {
        log('error', `${name}: missing required field "${field}"`);
        hasError = true;
      }
    });

    if (plugin.version && !/^\d+\.\d+(\.\d+)?$/.test(String(plugin.version))) {
      log('error', `${name}: invalid version format "${plugin.version}"`);
      hasError = true;
    }
  });

  if (!hasError) log('ok', 'All plugins have valid schema');
}

function checkFilesExist(doc) {
  console.log('\nChecking plugin files exist...');

  doc.plugins.forEach((plugin) => {
    if (!plugin.assets || plugin.assets.length === 0) {
      log('error', `${plugin.name}: no assets defined`);
      hasError = true;
      return;
    }

    plugin.assets.forEach((asset) => {
      if (fs.existsSync(asset)) {
        log('ok', `${asset} exists`);
      } else {
        log('error', `${asset} not found`);
        hasError = true;
      }
    });
  });
}

function validateJsSyntax(doc) {
  console.log('\nValidating JavaScript syntax...');

  doc.plugins.forEach((plugin) => {
    if (!plugin.assets) return;

    plugin.assets.forEach((asset) => {
      if (!fs.existsSync(asset)) return;

      const code = fs.readFileSync(asset, 'utf8');
      try {
        new Function(code);
        log('ok', `${asset} syntax OK`);
      } catch (e) {
        log('error', `${asset} syntax error: ${e.message}`);
        hasError = true;
      }
    });
  });
}

function validatePluginStructure(doc) {
  console.log('\nValidating plugin structure...');

  doc.plugins.forEach((plugin) => {
    if (!plugin.assets) return;

    plugin.assets.forEach((asset) => {
      if (!fs.existsSync(asset)) return;

      const code = fs.readFileSync(asset, 'utf8');

      if (!code.includes('function onLoad')) {
        log('error', `${asset} missing onLoad function`);
        hasError = true;
      } else {
        log('ok', `${asset} has onLoad function`);
      }

      if (!code.includes('registerPluginActions')) {
        log('warn', `${asset} missing registerPluginActions call`);
        hasWarning = true;
      }
    });
  });
}

function securityCheck(doc) {
  console.log('\nRunning security checks...');

  doc.plugins.forEach((plugin) => {
    if (!plugin.assets) return;

    plugin.assets.forEach((asset) => {
      if (!fs.existsSync(asset)) return;

      const code = fs.readFileSync(asset, 'utf8');
      log('info', `Scanning ${asset}`);

      DANGEROUS_PATTERNS.forEach(({ pattern, name }) => {
        if (pattern.test(code)) {
          log('warn', `Found potentially dangerous pattern: ${name}`);
          hasWarning = true;
        }
      });
    });
  });

  if (!hasWarning) log('ok', 'No dangerous patterns detected');
}

function checkDuplicates(doc) {
  console.log('\nChecking for duplicate plugins...');

  const names = doc.plugins.map((p) => p.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    log('error', `Duplicate plugin names: ${[...new Set(duplicates)].join(', ')}`);
    hasError = true;
  } else {
    log('ok', 'No duplicate plugin names');
  }
}

function main() {
  console.log('Plugin Validation Started');
  console.log('='.repeat(40));

  const doc = loadSpec();
  validateSchema(doc);
  checkFilesExist(doc);
  validateJsSyntax(doc);
  validatePluginStructure(doc);
  securityCheck(doc);
  checkDuplicates(doc);

  console.log('\n' + '='.repeat(40));

  if (hasError) {
    console.log('Validation FAILED');
    process.exit(1);
  } else if (hasWarning) {
    console.log('Validation PASSED with warnings');
  } else {
    console.log('Validation PASSED');
  }
}

main();
