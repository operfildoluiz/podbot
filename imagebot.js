const Jimp = require('jimp'),
      config = require('./config')

class Imagebot {

    constructor(content) {
        this.content = content;
    }

    async init() {
        await this.createCover()
        return true
    }

    async createCover() {
        console.log('=>', 'Criando a capa do episódio...');

        let background = './sources/background.png'
        let imgExported = `result/${this.content.number}_cover.png`
        
        let fontHeader = await Jimp.loadFont('./sources/new.fnt').then(font => font);
        let fontNumber = await Jimp.loadFont('./sources/number.fnt').then(font => font);
        let fontTitle = await Jimp.loadFont('./sources/texto.fnt').then(font => font);

        await Jimp.read(background)
                .then(image => {
                    return image
                    .print(fontHeader, 50, 50, {
                        text: 'Novo episódio no podBot',
                        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                        alignmentY: Jimp.VERTICAL_ALIGN_TOP
                    }, 500, 500)
                    .print(fontTitle, 50, 50, {
                        text: `"${this.content.title}"`,
                        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
                    }, 500, 500)
                    .print(fontNumber, 75, 75, {
                        text:  '#' + this.content.number,
                        alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
                        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
                    }, 500, 500)
                    .write(imgExported); // save
                })
                .catch(err => {
                    console.error(err);
                });
    }




}

module.exports = Imagebot;