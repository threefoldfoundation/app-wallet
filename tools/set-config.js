const argv = require('minimist')(process.argv.slice(2));
const fs = require('fs');
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
fs.writeFileSync(configPath, JSON.stringify(JSON.parse(config), null, 2));
