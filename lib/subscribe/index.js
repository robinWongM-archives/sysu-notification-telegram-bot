const debug = require('debug')('SYSUBOT_Subscribe')

const Database = require('../../database.js')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const stickerList = [
  'CAADBQADmgEAAiQKYgUndzpXDsxIgwI',
  'CAADBQADmwEAAiQKYgV27YFYOXIDHwI',
  'CAADBQADqgEAAiQKYgXon-zvyhxhxwI',
  'CAADBQADqwEAAiQKYgXh9S2gPJiH6QI',
  'CAADBQADsAEAAiQKYgWj7la1izJepQI',
  'CAADBQAD4QEAAiQKYgXfED81UNwhPQI',
  'CAADBQAD5wEAAiQKYgUbITVj4MacgwI',
]

module.exports = {
  async startHandler (ctx, next) {
    const categoryList = await ctx.user.getCategories({
      include: [Database.Site]
    })
    debug('current user scuscribe', categoryList)
    await ctx.reply(`这里是大山中学快递员。\n当前订阅列表：\n${categoryList.map((category) => `${category.site.name} - ${category.name}`).join('\n')}`,
      Extra.markup(() => Markup.inlineKeyboard([
        Markup.callbackButton('表情包', 'sticker'),
        Markup.callbackButton('管理订阅', 'subscribe')
      ]))
    )
  },
  async stickerHandler (ctx, next) {
    await ctx.replyWithSticker(stickerList[Math.floor(Math.random() * stickerList.length)])
  },
  async callbackHandler (ctx, next) {
    debug('Callback: ', ctx.match[0])
    switch (ctx.match[1]) {
      case 'sticker':
        await ctx.replyWithSticker(stickerList[Math.floor(Math.random() * stickerList.length)])
        break
      case 'subscribe':
        const categoryList = await ctx.user.getCategories({
          include: [Database.Site]
        })
        debug('current user scuscribe', categoryList)
        await ctx.editMessageText(`\n当前订阅列表：\n${categoryList.map((category) => `${category.site.name} - ${category.name}`).join('\n')}`,
          Extra.markup(() => Markup.inlineKeyboard([
            Markup.callbackButton('添加订阅', 'subscribeAdd'),
            Markup.callbackButton('移除订阅', 'subscribeDel')
          ])))
        break
      case 'subscribeAdd':
        let allCategoryList = await Database.Category.findAll({
          include: [{
            model: Database.Site,
          }, {
            model: Database.User,
            through: 'user_category'
          }]
        })

        let filteredCategoryList = []
        for (const category of allCategoryList) {
          const ret = await ctx.user.hasCategory(category.id)
          if (!ret) {
            filteredCategoryList.push(category)
          }
        }

        debug('current user not subscribe', filteredCategoryList)
        ctx.editMessageText('请点击需要订阅的通知类别：',
          Extra.markup(() => Markup.inlineKeyboard(filteredCategoryList.map((category) => Markup.callbackButton(
            `${category.site.name} - ${category.name}`,
            `subscribeAddId|${category.id}`
          )).concat(Markup.callbackButton('← 返回', 'subscribe')), {
            columns: 1
          }))
        )
        break
      case 'subscribeAddId':
        if (ctx.match[2]) {
          await ctx.user.addCategory(parseInt(ctx.match[2]))
          await ctx.user.save()
          ctx.editMessageText('添加完成。', Extra.markup(Markup.inlineKeyboard([
            Markup.callbackButton('← 返回', 'subscribeAdd')
          ])))
        }
        break
      case 'subscribeDel':
        const userCategoryList = await ctx.user.getCategories({
          include: [Database.Site]
        })
        debug('current user subscribe', userCategoryList)
        ctx.editMessageText('请点击需要取消订阅的通知类别：',
          Extra.markup(() => Markup.inlineKeyboard(userCategoryList.map((category) => Markup.callbackButton(
            `${category.site.name} - ${category.name}`,
            `subscribeDelId|${category.id}`
          )).concat(Markup.callbackButton('← 返回', 'subscribe')), {
            columns: 1
          }))
        )
        break
      case 'subscribeDelId':
        if (ctx.match[2]) {
          await ctx.user.removeCategory(parseInt(ctx.match[2]))
          await ctx.user.save()
          ctx.editMessageText('移除完成。', Extra.markup(Markup.inlineKeyboard([
            Markup.callbackButton('← 返回', 'subscribeDel')
          ])))
        }
        break
    }
    await ctx.answerCbQuery()
  }
}