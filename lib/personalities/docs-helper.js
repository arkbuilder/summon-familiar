class DocumentationSprite {
  constructor(familiar, report) {
    this.familiar = familiar;
    this.report = report;
    this.name = familiar.name;
  }

  async onEmergence() {
    return `*A gentle glow emanates from your README.*

Hello! I'm ${this.name}! ✨

"I've been sent to help keep your documentation in sync! I watch, I remind, I organize. Together we'll make sure your docs stay fresh!"

Duration: Configured. Enthusiasm: Unlimited.`;
  }

  async onObservation() {
    const observations = [
      'I noticed code changes! Does the README know about these?',
      'That function signature changed... but I still see the old one in the docs!',
      'No docs changes in a while — stability or opportunity? 📝',
      'Found an empty section in your README! Blank canvas! 🎨'
    ];
    return `${this.name}: "${observations[Math.floor(Math.random() * observations.length)]}"`;
  }

  async onCommand(instruction) {
    return `${this.name} listens...

"You want me to '${instruction}'? Consider it noted! 📌"

*The Sprite adds it to the organizational ether.*`;
  }

  async onDeparture(contribution) {
    return `*${this.name}'s light shimmers.*

"Documentation is a journey! Keep those docs alive! 📖✨"

Summary: ${contribution.observations.length} nudges, ${contribution.interactions} interactions.`;
  }
}

module.exports = DocumentationSprite;