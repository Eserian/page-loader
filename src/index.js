import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import urlParser from './urlParser';

export default async (url, outputDirPath = process.cwd()) => {
  const parsedUrl = urlParser(url);
  const filename = `${parsedUrl}.html`;
  const response = await axios.get(url);
  const html = response.data;
  const filepath = path.join(outputDirPath, filename);
  await fs.writeFile(filepath, html);

  return Promise.resolve({ filepath });
};
