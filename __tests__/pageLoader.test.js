import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';
import { beforeAll, expect } from '@jest/globals';
import pageLoader from '../src/index';

nock.disableNetConnect();

const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const url = 'https://ru.hexlet.io/courses';
const resultFileName = 'ru-hexlet-io-courses.html';
const resultImgPath = 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png';

let tmpDir;
let sourceHtml;
let expectedHtml;
let sourceHtmlWithImg;
let expectedHtmlWithImg;
let expectedImg;
let sourceHtmlWithAssets;
let expectedHtmlWithAssets;

beforeAll(async () => {
  sourceHtml = await fs.readFile(getFixturePath('source.html'), 'utf-8');
  sourceHtmlWithImg = await fs.readFile(getFixturePath('sourceWithImg.html'), 'utf-8');
  expectedHtml = await fs.readFile(getFixturePath('expected.html'), 'utf-8');
  expectedHtmlWithImg = await fs.readFile(getFixturePath('expectedWithImg.html'), 'utf-8');
  expectedImg = await fs.readFile(getFixturePath('expectedImg.png'), 'utf-8');
  sourceHtmlWithAssets = await fs.readFile(getFixturePath('sourceWithAssets.html'), 'utf-8');
  expectedHtmlWithAssets = await fs.readFile(getFixturePath('expectedWithAssets.html'), 'utf-8');
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('page loader', () => {
  test('return value', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, sourceHtml);

    const { filepath } = await pageLoader(url, tmpDir);

    expect(filepath).toBe(path.join(tmpDir, resultFileName));
  });

  test('load html', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, sourceHtml);

    const { filepath } = await pageLoader(url, tmpDir);
    const result = await fs.readFile(filepath, 'utf-8');

    expect(result).toBe(expectedHtml);
  });

  test('load image', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, sourceHtmlWithImg)
      .get('/assets/professions/nodejs.png')
      .reply(200, expectedImg);

    const { filepath } = await pageLoader(url, tmpDir);
    const resultImg = await fs.readFile(path.join(tmpDir, resultImgPath), 'utf-8');
    const resultHtml = await fs.readFile(filepath, 'utf-8');

    expect(resultHtml).toBe(expectedHtmlWithImg);
    expect(resultImg).toEqual(expectedImg);
  });

  test('load assets', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, sourceHtmlWithAssets)
      .get('/assets/professions/nodejs.png')
      .reply(200)
      .get('/assets/application.css')
      .reply(200)
      .get('/packs/js/runtime.js')
      .reply(200)
      .get('/courses')
      .reply(200);

    const { filepath } = await pageLoader(url, tmpDir);
    const resultHtml = await fs.readFile(filepath, 'utf-8');

    expect(resultHtml).toBe(expectedHtmlWithAssets);
  });
});
