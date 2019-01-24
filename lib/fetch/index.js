const debug = require('debug')('SYSUBOT_Fetch')

const Database = require('../../database.js')
const List = require('./list.js')

let config = {
  ParseType: null,
  Bot: null,
  Timer: {
    interval: 60000,
    timerID: null,
  },
  Status: 'stopped'
}

async function job () {
  let categoryList = await Database.Category.findAll({
    include: [Database.Site]
  })

  for (category of categoryList) {
    await List(category, Database, config.Bot, config.ParseType)
  }
}

module.exports = {
  start (Bot, ParseType, Timer) {
    this.stop()

    config.Bot = Bot
    config.ParseType = ParseType
    config.Timer = Timer
    config.Status = 'running'

    this.invoke()
  },
  stop () {
    if (config.Status === 'running') {
      clearTimeout(config.Timer.timerID)
      config.Status = 'stopped'
    }
  },
  async invoke () {
    if (config.Status === 'stopped') {
      return
    }

    await job()
    config.Timer.timerID = setTimeout(() => {
      this.invoke()
    }, config.Timer.interval)
  }
}