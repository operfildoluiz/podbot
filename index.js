const Audiobot = require('./audiobot'),
      Mainbot = require('./mainbot')

async function init() {

    console.log('======== EPISODIO COMEÇANDO!')

    const mainbot = new Mainbot();

    await mainbot.init()

    const audiobot = new Audiobot(mainbot.getContent());
    await audiobot.mergeAudio()
    await audiobot.increaseSpeed()

    console.log('======== EPISODIO PRONTO!')
    return true;

}

init()