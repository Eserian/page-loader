import { promises as fs } from 'fs';
import axios from 'axios';
import urlParser from './urlParser';

export default async (url, dirPath) => {
  const parsedUrl = urlParser(url);
  const filename = `${parsedUrl}.html`;
  const response = await axios.get(url);
  const html = response.data;
  const filepath = `${dirPath}/${filename}`;
  await fs.writeFile(filepath, html);

  return Promise.resolve({ filepath: `${dirPath}/${filename}` });
};
