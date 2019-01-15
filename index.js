(async () => {
  const Telegraf = require('telegraf')

  const Database = require('./database.js')
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
      default: site
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
    console.log(ctx.message.text)
    await next()
  })

  /* bot.start((ctx) => ctx.reply('Welcome!'))
  bot.help((ctx) => ctx.reply('Send me a sticker'))
  bot.on('sticker', (ctx) => ctx.reply('👍'))
  bot.hears('hi', (ctx) => ctx.reply('Hey there')) */

  bot.start(async (ctx, next) => {
    await Database.User.findOrCreate({
      where: {
        telegramId: ctx.from.id,
        chatId: ctx.chat.id
      }
    })
    ctx.reply('Welcome')
    Fetch(Database, bot.telegram)
    await next()
  })

  Fetch(Database, bot.telegram)

  await bot.launch()
})()