const axios = require("axios"),
  fs = require("fs"),
  Jimp = require("jimp"),
  imageDownloader = require("image-downloader");

const stateManager = require("../stateManager.js");

async function bot() {
  let state = stateManager.load();
  let temporaryFiles = [];

  let image = {};

  image.background = await getPexelsPhoto(state.episode.keyword);
  image.downloaded = await downloadBackground(
    image.background,
    state.episode.slug
  );
  await createCover(image.downloaded, state.episode, state.episode.slug);
  await deleteTemporaryFiles(temporaryFiles);

  async function createCover(background, episode, folder) {
    let coverImage = __dirname + `/../episodes/${folder}/${folder}.png`;

    const fonts = await loadFonts();

    return new Promise((resolve, reject) => {
      Jimp.read(background)
        .then(image => {
          image
            .blur(2)
            .brightness(-0.5)
            .print(
              fonts.header,
              0,
              50,
              {
                text: process.env.PODCAST_NAME.toUpperCase() || "PODCAST",
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_TOP
              },
              720,
              720
            )
            .print(
              fonts.title,
              0,
              0,
              {
                text: episode.title.toUpperCase(),
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
              },
              720,
              720
            )
            .print(
              fonts.number,
              0,
              -50,
              {
                text: "Episódio " + episode.number,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
              },
              720,
              720
            )
            .write(coverImage);

          resolve(image);
        })
        .catch(err => reject(err));
    });
  }

  state.image = image;
  stateManager.save(state);

  async function getPexelsPhoto(term) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `https://api.pexels.com/v1/search?query=${term}&per_page=1&page=1`,
          {
            headers: {
              Authorization: process.env.PEXELS_API_KEY
            }
          }
        )
        .then(res => resolve(res.data.photos[0]))
        .catch(err => reject(err));
    });
  }

  async function downloadBackground(details, folder) {
    let suffixUrlImage = "?auto=compress&cs=tinysrgb&fit=crop&h=720&w=720";

    let dest = __dirname + `/../episodes/${folder}/background.png`;
    temporaryFiles.push(dest);

    imageDownloader.image({
      url: details.src.original + suffixUrlImage,
      dest
    });

    return dest;
  }

  async function loadFonts() {
    return new Promise(async (resolve, reject) => {
      try {
        let header = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        let number = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        let title = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

        resolve({ header, number, title });
      } catch (e) {
        reject(e);
      }
    });
  }

  async function deleteTemporaryFiles(files) {
    return files.map(file => fs.unlinkSync(file));
  }

  return state;
}

module.exports = bot;
