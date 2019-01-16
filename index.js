(async () => {
  const Telegraf = require('telegraf')

  const Database = require('./database.js')
  const User = require('./user.js')
  const Fetch = require('./fetch.js')
  const DefaultConfig = require('./bot.config.js')

  // Initialize Database
  await Database.sequelize.sync()
  for (let site of DefaultConfig.sites) {
    let [siteItem] = await Database.Site.findOrCreate({
      where: {
        name: site.name,
        domain: site.domain
      },
      defaults: site
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
  const bot = new Telegraf(process.env.SYSU_BOT_TOKEN)
  bot.use(async (ctx, next) => {
    console.log(ctx.message)
    await next()
  })

  bot.use(User(Database))

  /* bot.start((ctx) => ctx.reply('Welcome!'))
  bot.help((ctx) => ctx.reply('Send me a sticker'))
  bot.on('sticker', (ctx) => ctx.reply('👍'))
  bot.hears('hi', (ctx) => ctx.reply('Hey there')) */

  bot.start(async (ctx, next) => {
    console.log(ctx.user)
    ctx.replyWithSticker('CAADBQADmwEAAiQKYgV27YFYOXIDHwI')
    Fetch.fetchJob(Database, bot.telegram)
    await next()
  })

  bot.action(/(all|less)\|(\d+)/, (ctx) => {
    // Using shortcut
    console.log(ctx.match)
    Fetch.callback(ctx, Database)
  })
  bot.action(/att\|(\d+)/, (ctx) => {
    // Using shortcut
    console.log(ctx.match)
    Fetch.attachmentCb(ctx, Database)
  })

  setInterval(() => {
    Fetch.fetchJob(Database, bot.telegram)
  }, 60000)
  
  /*
  let userList = await Database.User.findAll()
  for (let user of userList) {
    bot.telegram.sendMessage(user.chatId, `请注意，该 Bot 仍在非常早期的开发阶段，可能随时会删库（不跑路）并出现**大量冗余信息疯狂骚扰**的情况。如您觉得不适，请考虑**禁用该 Bot 的通知**，或者 **Delete & Stop 该 Bot**。非常感谢您使用大山中学快递员 Bot。`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  }
  */

  await bot.launch()
})()