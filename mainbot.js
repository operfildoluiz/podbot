const readline = require('readline-sync'),
      axios = require('axios'),
      fs = require('fs'),
      rimraf = require("rimraf"),
      config = require('./config')

class Mainbot {

    constructor() {
        this.content = {}
    }

    async init (downloadMp3 = true) {
        console.log('[BOT]','Iniciando a preparação do episódio')

        await this.createTempDir()

        this.content.title = config.mockupName || this.askForTitle()
        // this.content.description = config.mockupDescription || this.askForDescription()
        this.content.number = config.mockupNumber || this.askForEpisodeNumber()
        this.content.url = config.mockupUrl || this.askForPastebinSource()
        this.content.originText = await this.getTextFromPastebin()
        this.content.sentences = this.extractSentencesFromText()

        if (downloadMp3) {
            await this.assignIdIntoSentences()
            await this.assignMp3IntoSentences()
            await this.downloadMp3()
        }

    }

    async end() {
        await this.deleteTempDir()

        console.log('[BOT]','Episódio finalizado!')
        console.log('[BOT]','Conferir os arquivos na pasta [/result]')
    }

    getContent() {
        return this.content;
    }

    async createTempDir() {
        console.log('=>', 'Criando pastas temporárias...');

        let tempDir = './temp'
        let resultDdir = './result'

        if (!fs.existsSync(resultDdir)){
            await fs.mkdirSync(resultDdir)
        }

        if (!fs.existsSync(tempDir)){
            return await fs.mkdirSync(tempDir)
        }

    }

    async deleteTempDir() {
        console.log('=>', 'Removendo pasta temporária...');

        let dir = './temp'

        return await rimraf.sync(dir);

    }

    askForTitle() {
        const res = readline.question('Qual o titulo do episodio: ')
        return res
    }

    askForDescription() {
        const res = readline.question('Insira uma descricao curta: ')
        return res
    }

    askForEpisodeNumber() {
        const res = readline.question('Qual o numero desse episodio: ')
        return res
    }

    askForPastebinSource() {
        const res = readline.question('Entre a URL do Pastebin com a talk: ')
        return res
    }

    async getTextFromPastebin () {
        console.log('=>', 'Buscando o texto no Pastebin...');

        return await axios.get(this.content.url).then(res => res.data);
    }

    extractSentencesFromText() {
        console.log('=>', 'Extraindo as sentenças do texto...');

        const sentences = [];
        this.content.originText.split('\r\n\r\n').forEach(paragraph => {
            sentences.push({
                text: paragraph,
                host: 'main',
                id: '',
                mp3: ''
            })
        })

        return sentences
    }

    async assignIdIntoSentences() {
        console.log('=>', 'Localizando o id no conversor TTS...');

        for(let sentence of this.content.sentences) {
            try {
                let res = await axios.post(config.api, {
                                            engine:"Google",
                                            data: {
                                                text: sentence.text,
                                                voice:"pt-BR"
                                            }
                                        })

                sentence.id = res.data.id;
                sentence.shortId = res.data.id.split('-')[0]
            } catch (e) {
                console.log('[ERR] Assigning Id', e)
                return false;
            }
        }
    }

    async assignMp3IntoSentences() {
        console.log('=>', 'Buscando o mp3 no Google Translate...');

        const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

        for(let sentence of this.content.sentences) {

            try {
                await sleep(1500);
                let res = await axios.get(config.api + sentence.id)
                sentence.mp3 = res.data.location;
            } catch (e) {
                console.log('[ERR] Assigning MP3', e)
                return false;
            }
        }
    }

    async downloadMp3() {
        console.log('=>', 'Baixando os mp3 base...');

        for(let sentence of this.content.sentences) {

            await axios.request({
                responseType: 'arraybuffer',
                url: sentence.mp3,
                method: 'get',
                headers: {
                  'Content-Type': 'audio/mpeg',
                },
              }).then((result) => {
                const outputFilename = `temp/${sentence.shortId}.mp3`;
                fs.writeFileSync(outputFilename, result.data);
                return outputFilename;
              });
        }
    }

}

module.exports = Mainbot;
