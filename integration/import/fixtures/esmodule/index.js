import { strict as assert } from 'assert';
import * as fs from 'fs';
import { promisify } from 'util';

import * as rx from 'rxjs';
import * as operators from 'rxjs/operators';

const readFile = promisify(fs.readFile);

const rxSnapshot = JSON.parse(readFile('./rx.json', 'utf-8'));
const operatorsSnapshot = JSON.parse(readFile('./operators.json', 'utf-8'));

assert.ok(rx, 'main export should exists');
assert.ok(operators, 'operator export should exists');

assert.deepStrictEqual(Object.keys(rx).sort(), rxSnapshot.sort(), 'main export should include exports');
assert.deepStrictEqual(Object.keys(operators).sort(), operatorsSnapshot.sort(), 'operator export should include exports');