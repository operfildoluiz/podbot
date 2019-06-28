const prompts = require("prompts"),
  slugify = require("slugify"),
  fs = require("fs");

const stateManager = require("../stateManager.js");

const slugifyOptions = {
  replacement: "-",
  remove: /[*+~.()'"!:@]/g,
  lower: true
};

async function bot() {
  let state = stateManager.load();

  let questions = [
    {
      type: "text",
      name: "title",
      message: "Qual o título do episódio?",
      initial: "Product Owner: conheça as 4 características fundamentais"
    },
    {
      type: "text",
      name: "description",
      message: "Qual a descrição do episódio?",
      initial:
        "Conhecimentos de negócio, autonomia, disponibilidade e comunicação estão entre as principais skills do cargo de Product Owner"
    },
    {
      type: "text",
      name: "number",
      message: "Qual o número do episódio?",
      initial: "1x01"
    },
    {
      type: "text",
      name: "url",
      message: "Qual a URL origem do texto?",
      initial: "https://blog.impulso.network/product-owner/"
    }
  ];

  state.episode = await askForEpisodeDetails(questions);
  state.episode.slug = slugify(state.episode.title, slugifyOptions);

  await createFolder(state.episode.slug);

  stateManager.save(state);

  async function askForEpisodeDetails(questions) {
    return await prompts(questions);
  }

  async function createFolder(name) {
    if (!fs.existsSync(__dirname + `/../episodes/${name}`)) {
      await fs.mkdirSync(__dirname + `/../episodes/${name}`);
    }
  }

  return state;
}

module.exports = bot;
