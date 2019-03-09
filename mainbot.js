const readline = require('readline-sync'),
      axios = require('axios'),
      fs = require('fs'),
      aws = require('aws-sdk'),
      rimraf = require("rimraf"),
      config = require('./config')
      
const polly = new aws.Polly({
    accessKeyId: process.env.AWS_KEY_ID, 
    secretAccessKey: process.env.AWS_SECRET,
    signatureVersion: 'v4',
    region: 'us-east-1'
});

class Mainbot {

    constructor() {
        this.content = {}
    }

    async init () {
        console.log('[BOT]','Iniciando a preparação do episódio')

        await this.createTempDir()

        this.content.url = config.mockupUrl || this.askForPastebinSource()
        this.content.originText = await this.getTextFromPastebin()
        this.extractEpisodeDetails()
        this.content.sentences = this.extractSentencesFromText()

        let host = this.content.host;

        if (config.hosts[host].origin === 'google') {
            await this.assignIdIntoSentences()
            await this.assignMp3IntoSentences()
            await this.downloadMp3()
        } else {
            await this.synthetizePollyMp3()
        }

    }

    async end(sucessful = true) {
        await this.deleteTempDir()

        if (!sucessful) {
            console.log('[BOT]', 'Cancelando devido a algum erro');
        }

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
        await this.sleep(1500);

        try {
            return await rimraf.sync(dir);
        } catch(e) {
            return false;
        }

    }

    askForPastebinSource() {
        const res = readline.question('Entre a URL do Pastebin com a talk: ')
        return res
    }

    async getTextFromPastebin () {
        console.log('=>', 'Buscando o texto no Pastebin...');

        return await axios.get(this.content.url).then(res => res.data);
    }

    extractEpisodeDetails() {
        // Format: Host #99 - Title of episode
        console.log('=>', 'Extraindo os detalhes do episódio...');

        let sentence = this.content.originText.split('\r\n\r\n').slice(0,1);

        let arr = sentence[0].split('#')
        this.content.host = arr[0].trim()

        arr = arr[1].split(' - ')
        this.content.number = arr[0].trim()
        this.content.title = arr[1].trim()

        return true;
    }
    
    extractSentencesFromText() {
        console.log('=>', 'Extraindo as sentenças do texto...');

        const sentences = [];
        let arr = this.content.originText.split('\r\n\r\n');
        arr.slice(2).forEach((paragraph, i) => {

            if (paragraph.length > 200 && config.hosts[this.content.host].awsText !== undefined) {
                console.log('[ERR] Essa frase contém mais de 200 caracteres e não pode ser interpretada pelo Google TTS');
                console.log('=>',paragraph);
                this.end(false);
                process.exit(0)
            }

            sentences.push({
                shortId: i,
                text: paragraph,
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
            } catch (e) {
                console.log('[ERR] Assigning Id', e)
                return false;
            }
        }
    }

    async assignMp3IntoSentences() {
        console.log('=>', 'Buscando o mp3 no Google Translate...');

        for(let sentence of this.content.sentences) {

            try {
                await this.sleep(1500);
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

    async synthetizePollyMp3() {
        console.log('=>', 'Baixando os mp3 da AWS Polly...');

        for(let sentence of this.content.sentences) {

            const audio = await this.generatePollyAudio(sentence.text)
            try {
                await fs.writeFile(`temp/${sentence.shortId}.mp3`, audio.AudioStream, function(err) {
                    if (err) {
                        console.log('[ERR] FS', err)
                        return false
                    }
                    return true;
                })
                await this.sleep(2000)
            } catch (e) {
                console.log('[ERR] AWS', e);
                return false;
            }    
        }

    }

    generatePollyAudio (text)  {
        const params = {
          Text: text,
          OutputFormat: 'mp3',
          VoiceId: config.hosts[this.content.host].awsName
        }
      
        return polly.synthesizeSpeech(params).promise().then( audio => {
          if (audio.AudioStream instanceof Buffer) {
              return audio
          }
          else throw 'AudioStream is not a Buffer.'
        })
    }

    sleep (time)  { 
        return new Promise(resolve => setTimeout(resolve, time)) 
    }

}

module.exports = Mainbot;
