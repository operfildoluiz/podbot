const fs = require("fs");

const stateManager = require("../stateManager.js");

async function bot() {
  let state = stateManager.load();

  state.docs = await createMarkdownFile(state.episode);

  async function createMarkdownFile(episode) {
    const path = __dirname + `/../episodes/${episode.slug}/${episode.slug}.md`;

    let content =
      `# ${episode.title}\n\n` +
      `${episode.description}\n\n` +
      `🔗 **Link**: ${episode.url}\n` +
      `🎙️ **Apresentado por**: ${process.env.PODCAST_HOST}\n` +
      `🎧 **Episódio:** ${episode.number}`;

    fs.writeFileSync(path, content);

    return path;
  }

  stateManager.save(state);

  return state;
}

module.exports = bot;
