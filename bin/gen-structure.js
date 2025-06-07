#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { parseAndGenerate, directoryToAscii } from '../dist/parser.js';

const program = new Command();

program
    .name('gen-structure')
    .description('Bidirectional project structure generator: ASCII <-> filesystem')
    .option('--dry-run', 'Just show what would be created, do not create files')
    .option('-v, --verbose', 'Show verbose output')
    .option('-o, --out <path>', 'Output directory (when generating files) or output file for ASCII (when using --reverse)', '.')
    .option('--reverse <folder>', 'Read a folder path and output its ASCII structure')
    .argument('[input]', 'Input file (ASCII tree or YAML) to generate structure. Ignored if --reverse is used.')
    .addHelpText('afterAll','gen-structure structure.txt -o project')
    .addHelpText('afterAll','gen-structure --reverse project')
    .addHelpText('afterAll','gen-structure --reverse project -o ascii.txt')
    .showHelpAfterError();

program.parse();
const opts = program.opts();
const input = program.args[0];

const hasReverse = !!opts.reverse;
const hasInput = !!input;

if (hasReverse && hasInput) {
    program.error('Cannot use both input file and --reverse. Use only one mode at a time.');
}
if (!hasReverse && !hasInput) {
    program.error('You must provide an input file or use --reverse <folder>.');
}

if (hasReverse) {
    const targetDir = path.resolve(opts.reverse);
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        console.error(`Error: Path "${targetDir}" does not exist or is not a directory.`);
        process.exit(1);
    }
    const ascii = directoryToAscii(targetDir);
    if (opts.out && opts.out !== '.') {
        fs.writeFileSync(opts.out, ascii, 'utf-8');
        console.log(`ASCII structure saved to ${opts.out}`);
    } else {
        console.log(ascii);
    }
    process.exit(0);
}
parseAndGenerate(input, {
    dryRun: opts.dryRun,
    verbose: opts.verbose,
    outputDir: opts.out,
});
