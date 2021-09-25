import fs from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import { beforeAll, expect } from '@jest/globals';
import pageLoader from '../src/index';

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let tmpDir;
let expectedHtml;
const url = 'https://ru.hexlet.io/courses';
const resultFileName = 'ru-hexlet-io-courses.html';
const readFileCb = (err) => {
  if (err) throw err;
};

beforeAll(async () => {
  expectedHtml = await fs.readFile(getFixturePath('courses.html'), 'utf-8', readFileCb);
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'), readFileCb);
});

test('page loader', async () => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, expectedHtml);

  const { filepath } = await pageLoader(url, tmpDir);
  const result = await fs.readFile(filepath, readFileCb);

  expect(filepath).toBe(`${tmpDir}/${resultFileName}`);
  expect(result).toBe(expectedHtml);
});
