#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../../package.json';
import pageLoader from '../index';

const program = new Command();

program
  .version(version)
  .description('Download page')
  .option('-o, --output [dir]', 'output dir (default: "/app")')
  .arguments('<url>')
  .action(async (url, dir) => console.log(`\n${await pageLoader(url, dir)}`))
  .parse(process.argv);
