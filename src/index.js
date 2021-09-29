import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import flatten from 'lodash.flatten';
import replaceSeparator from './replaceSeparator.js';

const makeFileStruct = (hostname, pathname, outputDirPath) => {
  const slug = `${hostname}-${pathname.slice(1)}`;
  const preparedSlug = replaceSeparator(slug);
  const fullOutputDirPath = path.resolve(process.cwd(), outputDirPath);
  const mainFilename = `${preparedSlug}.html`;
  const mainFilepath = path.join(fullOutputDirPath, mainFilename);
  const assetsDirname = `${preparedSlug}_files`;
  const assetsPath = path.join(fullOutputDirPath, assetsDirname);
  const assetsPrefix = replaceSeparator(hostname);

  return {
    mainFilepath, assetsPath, assetsPrefix, assetsDirname,
  };
};

const assetsTypes = ['img'];

const assetsAttrsMap = {
  img: 'src',
};

const parseHtml = (html, assetsPrefix, assetsDir, assetsPath, hostname) => {
  const $ = cheerio.load(html);
  const assetsMap = assetsTypes.reduce((acc, type) => ({ ...acc, [type]: $(type).toArray() }), {});

  const parsedAssets = Object.entries(assetsMap).map(([type, assets]) => assets.map((asset) => {
    const attr = $(asset).attr(assetsAttrsMap[type]);
    const filename = `${assetsPrefix}${replaceSeparator(attr, '/')}`;
    const filepath = `${assetsPath}/${filename}`;
    const url = `https://${hostname}${attr}`;
    return {
      filepath, asset, url, filename,
    };
  }));

  flatten(parsedAssets).forEach((item) => {
    $(item.asset).attr('src', `${assetsDir}/${item.filename}`);
  });

  return { parsedHtml: $.html(), assets: flatten(parsedAssets) };
};

const downloadAsset = (asset) => axios({
  method: 'get',
  url: asset.url,
  responseType: 'arraybuffer',
})
  .then((response) => fs.writeFile(asset.filepath, response.data));

export default async (url, outputDirPath = '') => {
  const urlObj = new URL(url);
  const { hostname, pathname } = urlObj;
  const {
    mainFilepath, assetsPath, assetsPrefix, assetsDirname,
  } = makeFileStruct(hostname, pathname, outputDirPath);
  await fs.mkdir(assetsPath);

  const { data } = await axios.get(url);
  const { parsedHtml, assets } = parseHtml(data, assetsPrefix, assetsDirname, assetsPath, hostname);
  const promises = assets.map((asset) => downloadAsset(asset));
  await Promise.all(promises);
  await fs.writeFile(mainFilepath, parsedHtml);

  return Promise.resolve({ filepath: mainFilepath });
};
