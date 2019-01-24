(async () => {
  const HttpsProxyAgent = require('https-proxy-agent')
  const Telegraf = require('telegraf')
  const Extra = require('telegraf/extra')

  const Database = require('./database.js')
  const User = require('./user.js')
  const Fetch = require('./lib/fetch')
  const BotShortcut = require('./lib/bot-shortcut')
  const Subscribe = require('./lib/subscribe')
  const DefaultConfig = require('./bot.config.js')

  const debug = require('debug')('SYSUBOT_Bot')

  // Initialize Database
  await Database.sequelize.sync()
  for (let site of DefaultConfig.sites) {
    let [siteItem] = await Database.Site.findOrCreate({
      where: {
        name: site.name,
        domain: site.domain
      }
    })
    for (let category of site.categories) {
      let [categoryItem] = await Database.Category.findOrCreate({
        where: category,
        default: category
      })
      siteItem.addCategory(categoryItem)
    }
  }

  // Initialize Bot
  const bot = new Telegraf(process.env.SYSU_BOT_TOKEN, {
    telegram: {
      agent: new HttpsProxyAgent({
        host: '127.0.0.1',
        port: 23333
      })
    }
  })
  bot.use(async (ctx, next) => {
    debug('Received new message', ctx.message)
    await next()
  })

  bot.use(User(Database))

  // Random Sticker
  /*

  */


  /* bot.start(async (ctx, next) => {
    console.log(ctx.user)
    // TODO: random sticker
    ctx.replyWithSticker('CAADBQADmwEAAiQKYgV27YFYOXIDHwI')
    // ctx.reply('大山中学快递员 Bot 即将进行推送测试。\n测试推送内容为近期数据院本科教务通知与学生工作通知，频率约为 2 条 / 分钟，敬请留意。')
    await next()
  }) */
  bot.start(Subscribe.startHandler)

  bot.on('sticker', async (ctx, next) => {
    // ctx.reply(`#Sticker\nID: \`${ctx.message.sticker ? ctx.message.sticker.file_id : ''}\``, Extra.markdown())
  })
  bot.command('luojun', Subscribe.stickerHandler)

  bot.action(/(all|less|att)\|(\d+)/, (ctx) => {
    debug('Received action: ', ctx.match[0], ctx.match[1], ctx.match[2])
    BotShortcut.handlePost(ctx)
  })

  bot.action(/^(subscribeAddId|subscribeDelId)\|(\d+)/, Subscribe.callbackHandler)
  bot.action(/^(sticker|subscribeAdd|subscribeDel|subscribe|)$/, Subscribe.callbackHandler)

  bot.catch((err) => {
    require('debug')('SYSUBOT_Telegraf')('Ooops', err)
  })

  Fetch.start(bot, DefaultConfig.parseType, {
    interval: 6000
  })
  
  /* let userList = await Database.User.findAll()
  for (let user of userList) {
    bot.telegram.sendMessage(user.chatId, `大山中学快递员 Bot 即将进行推送测试。\n测试推送内容为近期数据院本科教务通知与学生工作通知，频率约为 2 条 / 分钟，敬请留意。`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  } */

  await bot.launch()
})()