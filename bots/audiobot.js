const aws = require("aws-sdk"),
  audioconcat = require("audioconcat"),
  fs = require("fs");

const stateManager = require("../stateManager.js");

const polly = new aws.Polly({
  accessKeyId: process.env.AWS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET,
  signatureVersion: "v4",
  region: "us-east-1"
});

async function bot() {
  let state = stateManager.load();
  let files = [];

  await synthAudioFiles(state.sentences, state.episode.slug);
  await mergeAudioFiles(state.episode.slug, files);
  await deleteTemporaryFiles(files);

  stateManager.save(state);

  async function synthAudioFiles(sentences, folder) {
    for (sentence of sentences) {
      let filename = __dirname + `/../episodes/${folder}/${+new Date()}.mp3`;
      files.push(filename);

      let audio = await generateAudioFile(sentence, folder);

      new Promise((resolve, reject) => {
        fs.writeFile(filename, audio.AudioStream, function(err) {
          if (err) reject(err);
          resolve();
        });
      });
    }
  }

  async function generateAudioFile(sentence, folder) {
    const params = {
      Text: sentence,
      OutputFormat: "mp3",
      VoiceId: process.env.AWS_POLLY_NAME
    };

    return new Promise((resolve, reject) => {
      polly
        .synthesizeSpeech(params)
        .promise()
        .then(audio => {
          if (audio.AudioStream instanceof Buffer) {
            resolve(audio);
          } else reject();
        })
        .catch(err => resolve(err));
    });
  }

  async function mergeAudioFiles(folder, files) {
    return new Promise((resolve, reject) => {
      audioconcat(files)
        .concat(__dirname + `/../episodes/${folder}/${folder}.mp3`)
        .on("error", err => reject(err))
        .on("end", output => resolve(output));
    });
  }

  async function deleteTemporaryFiles(files) {
    return files.map(file => fs.unlinkSync(file));
  }

  return state;
}

module.exports = bot;
