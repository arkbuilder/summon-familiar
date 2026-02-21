#!/usr/bin/env node

/**
 * Summon Familiar CLI
 * A generic AI agent companion system
 */

const { runCLI } = require('../lib/cli.js');

runCLI(process.argv.slice(2));
