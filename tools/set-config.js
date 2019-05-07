const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
const shell = require('shelljs');
const configPath = 'src/configuration.json';
if (!argv.configuration_file && !argv.configuration) {
  throw new Error('You must specify the configuration file --configuration_file or configuration --configuration');
}
let config = '';
if (argv.configuration_file) {
  config = fs.readFileSync(argv.configuration_file, 'utf-8');
} else {
  config = argv.configuration;
}
const parsedConfig = JSON.parse(config);
parsedConfig['version'] = shell.exec('git rev-parse --short HEAD').stdout.trim();
parsedConfig['buildTime'] = new Date().toISOString();
fs.writeFileSync(configPath, JSON.stringify(parsedConfig, null, 2));
