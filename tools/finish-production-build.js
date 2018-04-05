const fs = require('fs-extra');
const rimraf = require('rimraf');
const path = require('path');
const ncp = require('ncp').ncp;

const BASE_PATH = path.join(__dirname, '..', 'www');

removeUndeededFiles();
minifyTranslations();
copyResources();

function removeUndeededFiles() {
  // Only android 6 or above is supported so  only keep .woff2 font files
  const ignore = path.join(BASE_PATH, 'assets', 'fonts', '*.woff2');
  rimraf(path.join(BASE_PATH, 'assets', 'fonts', '*'), {glob: {ignore: ignore}}, () => {
    rimraf.sync(path.join('build', 'sw-toolbox.js'));
  });
}

function minifyTranslations() {
  let dir = path.join(BASE_PATH, 'assets', 'i18n');
  const filesNames = fs.readdirSync(dir);
  for (const fileName of filesNames) {
    let filePath = path.join(dir, fileName);
    let str = JSON.stringify(JSON.parse(fs.readFileSync(filePath))); // Remove whitespaces
    fs.outputFileSync(filePath, str);
  }
}

function copyResources() {
  console.info('Copying resources');
  const source = path.join(__dirname, '..', 'resources');
  const destination = path.join(BASE_PATH, 'resources');
  ncp(source, destination, () => {
  });
}
