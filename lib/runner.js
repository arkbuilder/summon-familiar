/**
 * Summon Familiar - Generic Runner
 * Core logic for summoning and managing familiars
 * Outputs to stdout, file, or configurable callback
 */

const fs = require('fs');
const path = require('path');

// Import personalities
const codeReviewPersonality = require('./personalities/code-review.js');
const docsHelperPersonality = require('./personalities/docs-helper.js');

const PERSONALITIES = {
  'code-review': codeReviewPersonality,
  'docs-helper': docsHelperPersonality
};

const ADJECTIVES = [
  'ancient', 'sleepy', 'grumpy', 'curious', 'mysterious',
  'wise', 'playful', 'sharp', 'gentle', 'fierce',
  'noble', 'witty', 'diligent', 'sage', 'quick',
  'scruffy', 'elegant', 'brave', 'cunning', 'loyal'
];

const ANIMALS = [
  'owl', 'raven', 'fox', 'cat', 'crow',
  'wolf', 'hawk', 'serpent', 'toad', 'ferret',
  'badger', 'lynx', 'raccoon', 'weasel', 'bat'
];

class FamiliarRunner {
  constructor(options = {}) {
    this.outputCallback = options.outputCallback || null;
    this.outputFile = options.outputFile || null;
    this.familiars = new Map();
    this.outputHistory = [];
  }

  /**
   * Summon a new familiar
   * @param {Object} options - Summon options
   * @param {string} options.type - Personality type
   * @param {string} options.name - Familiar name
   * @param {string} options.context - Optional context file path
   * @returns {Object} Summon result
   */
  async summon(options = {}) {
    try {
      const { type = 'docs-helper', name, context } = options;

      if (!PERSONALITIES[type]) {
        return {
          success: false,
          error: `Unknown familiar type: ${type}. Available: ${Object.keys(PERSONALITIES).join(', ')}`
        };
      }

      const familiarName = name || this.generateName();
      const personality = PERSONALITIES[type];

      // Load context if provided
      let contextContent = '';
      if (context) {
        try {
          contextContent = fs.readFileSync(path.resolve(context), 'utf-8');
        } catch (err) {
          return {
            success: false,
            error: `Failed to read context file: ${err.message}`
          };
        }
      }

      const familiar = {
        name: familiarName,
        type,
        description: personality.description,
        summonedAt: new Date().toISOString(),
        context: contextContent,
        messageHistory: []
      };

      this.familiars.set(familiarName, familiar);

      const result = {
        success: true,
        familiar: {
          name: familiarName,
          type,
          description: personality.description,
          greeting: personality.greeting(familiarName)
        }
      };

      this.output(result);
      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Dismiss a familiar
   * @param {string} name - Familiar name
   * @returns {Object} Dismiss result
   */
  async dismiss(name) {
    if (!this.familiars.has(name)) {
      return {
        success: false,
        error: `No familiar named "${name}" found`
      };
    }

    const familiar = this.familiars.get(name);
    const personality = PERSONALITIES[familiar.type];
    
    const farewell = personality.farewell ? personality.farewell(name) : `${name} has been dismissed.`;
    
    this.familiars.delete(name);

    const result = {
      success: true,
      message: farewell
    };

    this.output(result);
    return result;
  }

  /**
   * List all active familiars
   * @returns {Array} Array of familiar info
   */
  listFamiliars() {
    return Array.from(this.familiars.values()).map(f => ({
      name: f.name,
      type: f.type,
      summonedAt: f.summonedAt
    }));
  }

  /**
   * Send a message to a familiar
   * @param {string} name - Familiar name
   * @param {string} message - Message to send
   * @returns {Object} Chat result
   */
  async chat(name, message) {
    if (!this.familiars.has(name)) {
      return {
        success: false,
        error: `No familiar named "${name}" found. Use 'familiar summon' first.`
      };
    }

    const familiar = this.familiars.get(name);
    const personality = PERSONALITIES[familiar.type];

    // Build prompt with context and history
    const prompt = this.buildPrompt(familiar, message, personality);

    // Store message
    familiar.messageHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Generate response using personality
    const response = await personality.respond(prompt, familiar);

    // Store response
    familiar.messageHistory.push({
      role: 'familiar',
      content: response,
      timestamp: new Date().toISOString()
    });

    const result = {
      success: true,
      response,
      familiar: {
        name,
        type: familiar.type
      }
    };

    this.output(result);
    return result;
  }

  /**
   * Generate a unique familiar name
   * @returns {string} Generated name
   */
  generateName() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(Math.random() * 99) + 1;
    return `${adj}-${animal}-${num}`;
  }

  /**
   * Build the prompt for the familiar
   * @private
   */
  buildPrompt(familiar, message, personality) {
    let prompt = personality.systemPrompt;

    if (familiar.context) {
      prompt += `\n\nContext provided:\n${familiar.context}`;
    }

    // Add recent history (last 5 exchanges)
    const recentHistory = familiar.messageHistory.slice(-10);
    if (recentHistory.length > 0) {
      prompt += '\n\nRecent conversation:';
      for (const entry of recentHistory) {
        const speaker = entry.role === 'user' ? 'User' : familiar.name;
        prompt += `\n${speaker}: ${entry.content}`;
      }
    }

    prompt += `\n\nUser: ${message}\n${familiar.name}:`;

    return prompt;
  }

  /**
   * Output data via configured handlers
   * @private
   */
  output(data) {
    // Store in history
    this.outputHistory.push({
      timestamp: new Date().toISOString(),
      data
    });

    // Call output handler if configured
    if (this.outputCallback) {
      try {
        this.outputCallback(data);
      } catch (err) {
        console.error('Output callback error:', err);
      }
    }

    // Write to file if configured
    if (this.outputFile) {
      try {
        const logLine = JSON.stringify({ timestamp: new Date().toISOString(), data }) + '\n';
        fs.appendFileSync(this.outputFile, logLine);
      } catch (err) {
        console.error('Output file error:', err);
      }
    }
  }

  /**
   * Clear all familiars
   */
  clearAll() {
    this.familiars.clear();
    this.outputHistory = [];
  }

  /**
   * Get output history
   * @returns {Array} Output history
   */
  getHistory() {
    return [...this.outputHistory];
  }
}

module.exports = {
  FamiliarRunner,
  PERSONALITIES
};
