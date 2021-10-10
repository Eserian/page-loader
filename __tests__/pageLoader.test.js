import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import { beforeAll, expect } from '@jest/globals';
import pageLoader from '../src/index';

const assets = [
  {
    pathname: '/courses',
    fixture: 'courses.html',
    resultFilename: 'ru-hexlet-io-courses.html',
  },
  {
    pathname: '/assets/professions/nodejs.png',
    fixture: 'nodejs.png',
    resultFilename: 'ru-hexlet-io-assets-professions-nodejs.png',
  },
  {
    pathname: '/assets/application.css',
    fixture: 'application.css',
    resultFilename: 'ru-hexlet-io-assets-application.css',
  },
  {
    pathname: '/packs/js/runtime.js',
    fixture: 'runtime.js',
    resultFilename: 'ru-hexlet-io-packs-js-runtime.js',
  },
];

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let tmpDir;
let expectedHtml;

beforeAll(async () => {
  nock.disableNetConnect();
  expectedHtml = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  assets.forEach((asset) => {
    nock('https://ru.hexlet.io')
      .persist()
      .get(asset.pathname)
      .replyWithFile(200, getFixturePath(asset.fixture));
  });
});

afterEach(() => {
  nock.cleanAll();
});

describe('page loader', () => {
  test('should work correctly', async () => {
    const { filepath } = await pageLoader('https://ru.hexlet.io/courses', tmpDir);

    const resultHtml = await fs.readFile(filepath, 'utf-8');
    expect(resultHtml).toBe(expectedHtml);
  });

  test('should download assets', async () => {
    await pageLoader('https://ru.hexlet.io/courses', tmpDir);

    await Promise.all(assets.map(async (asset) => {
      const expectedFile = await fs.readFile(getFixturePath(asset.fixture), 'utf-8');
      const resultFile = await fs.readFile(path.join(tmpDir, 'ru-hexlet-io-courses_files', asset.resultFilename), 'utf-8');

      expect(expectedFile).toEqual(resultFile);
    }));
  });

  test.each([
    401,
    403,
    404,
    500,
  ])('should handle %d error', async (errorCode) => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(errorCode);

    await expect(pageLoader('https://ru.hexlet.io', tmpDir)).rejects.toThrow();
  });
});
