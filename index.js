require('dotenv').load();

const Audiobot = require('./audiobot'),
      Imagebot = require('./imagebot'),
      Mainbot = require('./mainbot')

async function init() {

    console.log('======== EPISODIO COMEÇANDO!')

    const mainbot = new Mainbot();
    await mainbot.init()

    const audiobot = new Audiobot(mainbot.getContent());
    await audiobot.init()

    const imagebot = new Imagebot(mainbot.getContent());
    await imagebot.init()

    await mainbot.end();

    console.log('======== EPISODIO PRONTO!')

    return true;

}

init()