const audioconcat = require('audioconcat'),
      ffmpeg = require('fluent-ffmpeg'),
      config = require('./config')

class Audiobot {

    constructor(content) {
        this.content = content;
    }

    async mergeAudio() {
        console.log('=>', 'Gerando o mp3 mergeado...');

        let assets = [config.intro];
        this.content.sentences.forEach(sentence => assets.push(`mp3/${sentence.shortId}.mp3`));

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

    async increaseSpeed() {
        console.log('=>', 'Aumentando a velocidade...');

        return await ffmpeg('mp3/concat.mp3')
                .audioFilters(['atempo=2.0','asetrate=44100*1/2'])
                .save('result.mp3')
    }
}

module.exports = Audiobot;