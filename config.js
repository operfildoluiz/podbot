const config = {
    api: 'https://api.soundoftext.com/sounds/',
    intro: './sources/intro.mp3',
    hosts: {
        'Samanta': {
            tempo: 1,
            origin: 'polly',
            awsName: 'Vitoria'
        },
        'Willy': {
            tempo: 1,
            origin: 'polly',
            awsName: 'Ricardo'
        },
        'Lea': {
            tempo: 1.5,
            origin: 'google'
        },
    },
    // mockupUrl: 'https://pastebin.com/raw/i8GTFEfq'
}

module.exports = config;