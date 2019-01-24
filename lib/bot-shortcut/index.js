const debug = require('debug')('SYSUBOT_BotShortcut')

const Database = require('../../database.js')

const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const moment = require('moment')

const N = '\n'
let broadcastLimit = 1

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  async broadcast (Bot, list = [], text, extra) {
    for (let user of list) {
      debug('Extra', extra)
      await Bot.telegram.sendMessage(user.chatId, text, extra)
    }
  },
  async broadcastPost (post, Bot) {
    debug('current limit', broadcastLimit)
    if (!--broadcastLimit) {
      await sleep(30000)
      broadcastLimit++
    }

    const category = await post.getCategory()
    const userList = await category.getUsers()
    //const userList = await this.getAllUsers()
    const {text, extra} = await this.generateNotification(post, category, 'less')
    await this.broadcast(Bot, userList, text, extra)
  },
  async handlePost (ctx) {
    if (ctx.match[0] && ctx.match[1] && ctx.match[2]) {
      let postItem = await Database.Post.findOne({
        where: {
          id: ctx.match[2]
        },
        include: [{
          model: Database.Category,
          include: [Database.Site]
        }]
      })

      if (!postItem) {
        ctx.answerCbQuery('未找到对应的 Announcement，可能这个 Bot 已删库跑路')
        return
      }

      let notification = await this.generateNotification(postItem, postItem.category, ctx.match[1])
      ctx.editMessageText(notification.text, notification.extra)
    }
    ctx.answerCbQuery()
  },

  generateExcerpt (postItem) {
    return `#学院通知 ${
      N}*${ postItem.title }* ${
      N} ${
      N}${ postItem.excerpt } ${
      N} ${
      N}#${ category.site.name } #${ category.name } ${
      N}发布日期：${ postItem.publishDate } ${
      N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }`
  },

  generateFull (postItem) {
    return `#学院通知 ${
      N}*${ postItem.title }* ${
      N} ${
      N}${ postItem.content.length > 4000 ? '全文内容过长，请访问原文链接进行查看。' : postItem.content } ${
      N} ${
      N}#${ category.site.name } #${ category.name } ${
      N}发布日期：${ postItem.publishDate } ${
      N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }` 
  },

  async generateAttachmentList (postItem) {
    let attachmentList = await postItem.getAttachments()

    return `#学院通知 ${
      N}附件列表 - *${ postItem.title }* ${
      N} ${
      N}${ attachmentList.map(attachmentItem => {
        return `- [${attachmentItem.name}](${attachmentItem.url})`
      }).join('\n\n') } ${
      N} ${
      N}#${ category.site.name } #${ category.name } ${
      N}发布日期：${ postItem.publishDate } ${
      N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }`
  },

  async generateButton (postItem, type) {
    let attachmentNum = (await postItem.getAttachments()).length
    let attachmentButton = attachmentNum > 0 ? [Markup.callbackButton(`📎 ${attachmentNum} 附件`, `att|${postItem.id}`)] : []

    switch (type) {
      case 'less':
        return [
          Markup.callbackButton('↓ 全文', `all|${postItem.id}`),
          Markup.urlButton('🔗 链接', postItem.url),
          ...attachmentButton
        ]
      case 'all':
        return [
          Markup.callbackButton('↑ 收起', `less|${postItem.id}`),
          Markup.urlButton('🔗 链接', postItem.url),
          ...attachmentButton
        ]
      case 'att':
        return [
          Markup.callbackButton('🔙 返回', `less|${postItem.id}`)
        ]
    }
  },

  async generateNotification (postItem, category, type) {
    let buttons = await this.generateButton(postItem, type)
    debug('generatedButtons', buttons)

    return {
      text: type === 'less' ? this.generateExcerpt(postItem) : 
            type === 'all' ? this.generateFull(postItem) : 
            (await this.generateAttachmentList(postItem)),
      extra: Extra.markdown()
        .notifications(false)
        .webPreview(false)
        .markup(() => Markup.inlineKeyboard(buttons))
    }
  },

  async getAllUsers () {
    return (await Database.User.findAll())
  }
}