const path = require('path');
const klawSync = require('klaw-sync');
const bo = require('@angular-devkit/build-optimizer');
const fs = require('fs-extra');
const { addLicenseTextToFile, addLicenseToFile } = require('./add-license-to-file');
const { cleanSourceMapRoot } = require('../.make-helpers');

const ROOT = 'dist/';
const CJS_ROOT = ROOT + 'cjs/';
const ESM_ROOT = ROOT + 'esm/';
const ESM2015_ROOT = ROOT + 'esm2015/';
const UMD_ROOT = ROOT + 'global/';
const ESM_FOR_ROLLUP_ROOT = ROOT + 'esm_for_rollup/';
const TYPE_ROOT = ROOT + 'types/';
const UMD_PKG = ROOT + 'bundles/';

// License info for minified files
let licenseUrl = 'https://github.com/ReactiveX/RxJS/blob/master/LICENSE.txt';
let license = 'Apache License 2.0 ' + licenseUrl;

// Execute build optimizer transforms on ESM files
klawSync(ESM_ROOT, {
  nodir: true,
  filter: function (item) {
    return item.path.endsWith('.js');
  }
})
  .map(item => item.path.slice((`${__dirname}/${ESM_ROOT}`).length))
  .map(fileName => {
    if (!bo) return fileName;
    let fullPath = path.resolve(__dirname, ESM_ROOT, fileName);
    // The file won't exist when running build_test as we don't create the ESM sources
    if (!fs.existsSync(fullPath)) return fileName;
    let content = fs.readFileSync(fullPath).toString();
    let transformed = bo.transformJavascript({
      content: content,
      getTransforms: [bo.getPrefixClassesTransformer, bo.getPrefixFunctionsTransformer, bo.getFoldFileTransformer]
    });
    fs.writeFileSync(fullPath, transformed.content);
    return fileName;
  });

if (fs.existsSync(UMD_ROOT)) {
  fs.copySync(UMD_ROOT, UMD_PKG);
  // Clean up source map paths so they can be re-mapped
  klawSync(UMD_PKG, { filter: (item) => item.path.endsWith('.js.map') })
    .map(f => f.path)
    .forEach(fName => {
      const sourceMap = fs.readJsonSync(fName);
      sourceMap.sources = sourceMap.sources.map(s => {
        const nm = 'node_modules/';
        const rr = path.resolve(ESM_FOR_ROLLUP_ROOT);
        if (s.includes(nm)) {
          return s.substring(s.indexOf(nm) + nm.length);
        } else if (s.includes(rr)) {
          return s.substring(s.indexOf(rr) + rr.length);
        }
        return s;
      });
      fs.writeJsonSync(fName, sourceMap);
    });

  // Add licenses to tops of bundles
  addLicenseToFile('LICENSE.txt', UMD_PKG + 'rxjs.umd.js');
  addLicenseTextToFile(license, UMD_PKG + 'rxjs.umd.min.js');
  addLicenseToFile('LICENSE.txt', UMD_PKG + 'rxjs.umd.js');
  addLicenseTextToFile(license, UMD_PKG + 'rxjs.umd.min.js');
  cleanSourceMapRoot(UMD_PKG, CJS_ROOT);
}

// remove umd.js/umd.d.ts files that are only needed for creation of the umd bundle
fs.removeSync(CJS_ROOT + '/internal/umd.js');
fs.removeSync(CJS_ROOT + '/internal/umd.js.map');
fs.removeSync(ESM_ROOT + '/internal/umd.js');
fs.removeSync(ESM_ROOT + '/internal/umd.js.map');
fs.removeSync(ESM2015_ROOT + '/internal/umd.js');
fs.removeSync(ESM2015_ROOT + '/internal/umd.js.map');
fs.removeSync(TYPE_ROOT + '/internal/umd.d.ts');
