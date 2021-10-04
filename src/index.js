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

const assetsTypes = ['img', 'link', 'script'];

const assetsAttrsMap = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const parseHtml = (html, assetsPrefix, assetsDir, assetsPath, hostname, origin) => {
  const $ = cheerio.load(html);
  const assetsMap = assetsTypes.reduce((acc, type) => ({ ...acc, [type]: $(type).toArray() }), {});

  const parsedAssets = Object.entries(assetsMap).map(([type, assets]) => assets.map((asset) => {
    const attr = $(asset).attr(assetsAttrsMap[type]);
    const filename = `${assetsPrefix}${replaceSeparator(attr, '/')}`;
    const filepath = `${assetsPath}/${filename}`;
    const url = new URL(attr, origin);
    return {
      filepath, asset, url, filename, type,
    };
  }));

  const assetsToDownload = flatten(parsedAssets).filter(({ url }) => url.origin === origin);

  assetsToDownload.forEach((item) => {
    const { ext } = path.parse(item.url.pathname);
    const filename = ext ? item.url.pathname : `${item.url.pathname}.html`;
    const filepath = `${replaceSeparator(item.url.hostname)}${replaceSeparator(filename, '/')}`;
    $(item.asset).attr(assetsAttrsMap[item.type], `${assetsDir}/${filepath}`);
  });

  return { parsedHtml: $.html(), assets: assetsToDownload };
};

const downloadAsset = (asset) => axios({
  method: 'get',
  url: asset.url.toString(),
  responseType: 'arraybuffer',
})
  .then((response) => fs.writeFile(asset.filepath, response.data));

export default async (url, outputDirPath = '') => {
  const urlObj = new URL(url);
  const { hostname, pathname, origin } = urlObj;
  const {
    mainFilepath, assetsPath, assetsPrefix, assetsDirname,
  } = makeFileStruct(hostname, pathname, outputDirPath);

  try {
    await fs.access(assetsPath);
  } catch (e) {
    await fs.mkdir(assetsPath);
  }

  const { data } = await axios.get(url);
  const {
    parsedHtml, assets,
  } = parseHtml(data, assetsPrefix, assetsDirname, assetsPath, hostname, origin);
  const promises = assets.map((asset) => downloadAsset(asset));
  await Promise.all(promises);
  await fs.writeFile(mainFilepath, parsedHtml);

  return Promise.resolve({ filepath: mainFilepath });
};
