#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../../package.json';
import pageLoader from '../index.js';

const program = new Command();

program
  .version(version)
  .arguments('<url>')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .action(async (url, options) => {
    try {
      const { filepath } = await pageLoader(url, options.output);
      console.log(filepath);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })
  .parse(process.argv);
