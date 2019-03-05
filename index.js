const readline = require('readline-sync'),
      axios = require('axios'),
      fs = require('fs'),
      audioconcat = require('audioconcat'),
      ffmpeg = require('fluent-ffmpeg')

async function init() {

    console.log('======== EPISODIO COMEÇANDO!')

    const config = {
        // cachedPage: 'https://pastebin.com/raw/NEQSwC88',
        api: 'https://api.soundoftext.com/sounds/',
        intro: 'mp3/intro.mp3',
    }
    
    const content = {}
    content.url = config.cachedPage || askForPastebinSource()
    content.originText = await getTextFromPastebin()
    content.sentences = extractSentencesFromText()  

    await assignIdIntoSentences()
    await assignMp3IntoSentences()
    await downloadMp3()
    await mergeAudio()
    await increaseSpeed()

    function askForPastebinSource() {
        const res = readline.question('Entre a URL do Pastebin com a talk: ')
        return res
    }

    async function getTextFromPastebin() {
        console.log('=>', 'Buscando o texto no Pastebin...');
        
        return await axios.get(content.url).then(res => res.data);
    }

    function extractSentencesFromText() {
        console.log('=>', 'Extraindo as sentenças do texto...');

        const sentences = [];
        content.originText.split('\r\n\r\n').forEach(paragraph => {
            sentences.push({
                text: paragraph,
                host: 'main',
                id: '',
                mp3: ''
            })
        })

        return sentences
    }

    async function assignIdIntoSentences() {
        console.log('=>', 'Localizando o id no conversor TTS...');

        for(sentence of content.sentences) {
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

    async function assignMp3IntoSentences() {
        console.log('=>', 'Buscando o mp3 no Google Translate...');

        const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));

        for(sentence of content.sentences) {
            
            try {
                await sleep(1500);
                let res = await axios.get(config.api + sentence.id)
                sentence.mp3 = res.data.location;  
                if (sentence.mp3 === undefined)
                    delete sentence                 
            } catch (e) {
                console.log('[ERR] Assigning MP3', e)
                return false;
            }
        }
    }    

    async function downloadMp3() {
        console.log('=>', 'Baixando os mp3 base...');
        
        for(sentence of content.sentences) {

            await axios.request({
                responseType: 'arraybuffer',
                url: sentence.mp3,
                method: 'get',
                headers: {
                  'Content-Type': 'audio/mpeg',
                },
              }).then((result) => {
                const outputFilename = `mp3/${sentence.shortId}.mp3`;
                fs.writeFileSync(outputFilename, result.data);
                return outputFilename;
              });
        }
    }

    async function mergeAudio() {
        console.log('=>', 'Gerando o mp3 mergeado...');

        let assets = [config.intro];
        content.sentences.forEach(sentence => assets.push(`mp3/${sentence.shortId}.mp3`));

        return await new Promise((resolve, reject) => {
            audioconcat(assets)
            .concat('mp3/concat.mp3')
            .on('error', e => {
                console.log('[ERR] Concatenating', e) 
                reject(e)
            })
            .on('end', output => resolve(output))
        });
    }

    async function increaseSpeed() {
        console.log('=>', 'Aumentando a velocidade...');

        return await ffmpeg('mp3/concat.mp3')
                .audioFilters(['atempo=2.0','asetrate=44100*1/2'])
                .save('mp3/result.mp3')
    }

    console.log('======== EPISODIO PRONTO!')

}

init()