const axios = require("axios"),
  unfluff = require("unfluff"),
  sentenceTokenizer = require("sentence-tokenizer");

const stateManager = require("../stateManager.js");
const tokenizer = new sentenceTokenizer();

async function bot() {
  let state = stateManager.load();

  let extractedText = await extractTextFromUrl(state.episode.url);
  state.text = extractedText.text();
  state.sentences = await extractSentencesFromText(state.text);

  async function extractSentencesFromText(content) {
    tokenizer.setEntry(content);

    return tokenizer.getSentences().map(sentence => {
      return sentence.replace(/\n/g, " ").replace(/\"/, "'");
    });
  }

  async function extractTextFromUrl(url) {
    return new Promise((resolve, reject) => {
      axios
        .get(url)
        .then(res => resolve(unfluff.lazy(res.data)))
        .catch(err => reject(err));
    });
  }

  stateManager.save(state);

  return state;
}

module.exports = bot;
