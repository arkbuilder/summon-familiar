/**
 * Summon Familiar - Generic CLI
 * A standalone, importable CLI for managing AI familiars
 */

const { FamiliarRunner } = require('./runner.js');

class FamiliarCLI {
  constructor(options = {}) {
    this.runner = new FamiliarRunner(options);
    this.outputHandler = options.outputHandler || console.log;
    this.errorHandler = options.errorHandler || console.error;
  }

  async run(args) {
    const command = args[0] || 'help';

    try {
      switch (command) {
        case 'summon':
          return await this.handleSummon(args.slice(1));
        case 'dismiss':
          return await this.handleDismiss(args.slice(1));
        case 'list':
          return await this.handleList();
        case 'chat':
          return await this.handleChat(args.slice(1));
        case 'help':
        default:
          return this.showHelp();
      }
    } catch (error) {
      this.errorHandler(`Error: ${error.message}`);
      return 1;
    }
  }

  async handleSummon(args) {
    const options = this.parseArgs(args);
    const type = options.type || 'docs-helper';
    const name = options.name || this.runner.generateName();
    const context = options.context;

    const result = await this.runner.summon({ type, name, context });
    
    if (result.success) {
      this.outputHandler(`
✨ Familiar Summoned! ✨

Name: ${result.familiar.name}
Type: ${result.familiar.type}
Personality: ${result.familiar.description}

${result.familiar.greeting}

Use 'familiar chat ${result.familiar.name} "your message"' to interact,
or 'familiar dismiss ${result.familiar.name}' when done.
`);
      return 0;
    } else {
      this.errorHandler(`Failed to summon familiar: ${result.error}`);
      return 1;
    }
  }

  async handleDismiss(args) {
    if (args.length === 0) {
      this.errorHandler('Usage: familiar dismiss <name>');
      return 1;
    }

    const name = args[0];
    const result = await this.runner.dismiss(name);

    if (result.success) {
      this.outputHandler(`✓ ${result.message}`);
      return 0;
    } else {
      this.errorHandler(`Failed to dismiss familiar: ${result.error}`);
      return 1;
    }
  }

  async handleList() {
    const familiars = this.runner.listFamiliars();
    
    if (familiars.length === 0) {
      this.outputHandler('No active familiars. Use "familiar summon" to create one.');
      return 0;
    }

    this.outputHandler('\nActive Familiars:');
    this.outputHandler('─'.repeat(50));
    
    for (const familiar of familiars) {
      this.outputHandler(`
  Name: ${familiar.name}
  Type: ${familiar.type}
  Summoned: ${familiar.summonedAt}
`);
    }
    
    return 0;
  }

  async handleChat(args) {
    if (args.length < 2) {
      this.errorHandler('Usage: familiar chat <name> "your message"');
      return 1;
    }

    const name = args[0];
    const message = args.slice(1).join(' ');
    
    const result = await this.runner.chat(name, message);

    if (result.success) {
      this.outputHandler(result.response);
      return 0;
    } else {
      this.errorHandler(`Chat failed: ${result.error}`);
      return 1;
    }
  }

  showHelp() {
    this.outputHandler(`
Summon Familiar - AI Agent Companion System

Usage: familiar <command> [options]

Commands:
  summon [options]     Summon a new familiar
    --type <type>      Familiar type (code-review, docs-helper)
    --name <name>      Custom name (optional, auto-generated if not provided)
    --context <file>   File to provide as context

  dismiss <name>       Dismiss a familiar

  list                 List all active familiars

  chat <name> <msg>    Send a message to a familiar

  help                 Show this help message

Examples:
  familiar summon --type code-review
  familiar summon --type docs-helper --name "DocHelper"
  familiar summon --type code-review --context ./src/app.js
  familiar dismiss scruffy-owl-42
  familiar chat scruffy-owl-42 "Is this function too complex?"
`);
    return 0;
  }

  parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--type' && args[i + 1]) {
        options.type = args[i + 1];
        i++;
      } else if (args[i] === '--name' && args[i + 1]) {
        options.name = args[i + 1];
        i++;
      } else if (args[i] === '--context' && args[i + 1]) {
        options.context = args[i + 1];
        i++;
      }
    }
    return options;
  }
}

// Standalone CLI runner
async function runCLI(args) {
  const cli = new FamiliarCLI();
  const exitCode = await cli.run(args);
  process.exit(exitCode);
}

// Module exports for programmatic usage
module.exports = {
  FamiliarCLI,
  runCLI
};
