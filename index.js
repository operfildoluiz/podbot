require("dotenv").config();

const bots = {
  input: require("./bots/inputbot"),
  text: require("./bots/textbot"),
  audio: require("./bots/audiobot"),
  image: require("./bots/imagebot"),
  docs: require("./bots/docsbot")
};

async function main() {
  // await bots.input();
  // await bots.text();
  // await bots.audio();
  // await bots.image();
  await bots.docs();
}

main();
