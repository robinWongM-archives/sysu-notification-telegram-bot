const debug = require('debug')('Fetch')

const got = require('got')
const cheerio = require('cheerio')
const moment = require('moment')

const TurndownService = require('turndown')
const turndownService = new TurndownService()

turndownService.addRule('pAsBr', {
  filter: ['p'],
  replacement: content => `\n${content.trim()}\n`
})
turndownService.addRule('tgBold', {
  filter: ['b', 'strong'],
  replacement: content => `*${content.trim()}*`
})
turndownService.addRule('removeTable', {
  filter: ['table'],
  replacement: content => '（表格内容，请访问原文链接查看）'
})

const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const N = '\n'
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function parseList(Database, category, selector, Telegram) {
  let limit = 1

  let html = (await got(`http://${ category.site.domain }/${ category.path }`)).body
  let $ = cheerio.load(html)
  let notificationList = []
  $(selector).each((i, el) => {
    notificationList.push($(el))
  })

  for (let notification of notificationList.reverse()) {
    if (!limit) {
      break
    }

    let link = notification.children('a')
    let pageUrl = `http://${ category.site.domain }${ link.attr('href') }`
    let dateLabel = notification.children('.p-fl-time')

    // Access every page
    let $1 = cheerio.load((await got(pageUrl)).body)
    let titleEl = $1('.page-header')

    let [postItem, wasCreated] = await Database.Post.findOrCreate({
      where: {
        url: pageUrl,
        title: titleEl.text().trim(),
        publishDate: dateLabel.text().trim()
      }
    })
    if (wasCreated) {
      debug('Detected new post', postItem.title, postItem.publishDate)
      category.addPost(postItem)
      
      // Parse content
      let contentEl = $1('.field-name-body.field-type-text-with-summary .field-items .field-item')
      postItem.content = turndownService.turndown(contentEl.html())
      debug('content', postItem.content)
      postItem.excerpt = postItem.content.split('\n').slice(0, 2).join('\n')
      debug('excerpt', postItem.excerpt)

      // Excerpt
      /* let firstParagraph = contentEl.children('p').first()
      debug('firstParagraph', firstParagraph.text())
      let excerpt = firstParagraph.text().trim()
      debug('firstExcerpt', excerpt)
      if (['：', '！', ':', '!'].some(appendix => excerpt.endsWith(appendix)) &&
          excerpt.length < 20 || 
          ['各', '本', '研', '2'].some(prefix => excerpt.startsWith(prefix))) {
        excerpt = `${excerpt}\n${firstParagraph.next().text().trim()}`
        debug('secondExcerpt', excerpt)
      } */

      // Parse attachment
      let attachmentList = []
      $1('.field-name-field-file .field-items .field-item').each((i, el) => {
        attachmentList.push($(el))
      })
      for (let attachment of attachmentList) {
        let fileSpan = attachment.children('.file')
        let [attachmentItem, wasCreated] = await Database.Attachment.findOrCreate({
          where: {
            name: fileSpan.children('a').text().trim(),
            url: fileSpan.children('a').attr('href'),
            fileType: fileSpan.children('img').attr('title')
          }
        })
        postItem.addAttachment(attachmentItem)
      }

      await postItem.save()

      debug('attachmentNum', (await postItem.getAttachments()).length)
      let attachmentNum = (await postItem.getAttachments()).length
      let attachmentButton = attachmentNum > 0 ? [Markup.callbackButton(`📎 ${attachmentNum} 附件`, `att|${postItem.id}`)] : []

      // 群发消息
      // let userList = await category.getUsers()
      let userList = await Database.User.findAll()
      for (let user of userList) {
        Telegram.sendMessage(
          user.chatId, 
          `#学院通知 ${
          N}*${ postItem.title }* ${
          N} ${
          N}${ postItem.excerpt } ${
          N} ${
          N}#${ category.site.name } #${ category.name } ${
          N}发布日期：${ postItem.publishDate } ${
          N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }`, 
          Extra.markdown()
            .notifications(false)
            .webPreview(false)
            .markup((m) => {
              return m.inlineKeyboard([
                m.callbackButton('↓ 全文', `all|${postItem.id}`),
                m.urlButton('🔗 链接', postItem.url),
                ...attachmentButton
              ])
            })
          )
        limit--
        await sleep(500)
      }
    }
    //console.log(link.text(), `https://${ category.site.domain }${ link.attr('href') }`)
  }
}

module.exports = {
  async fetchJob(Database, Telegram) {
    let categoryList = await Database.Category.findAll({
      include: [Database.Site]
    })

    for (category of categoryList) {
      // TODO 
      await parseList(Database, category, '.full-page-list ul li', Telegram)
    }
  },
  async callback(ctx, Database) {
    if (ctx.match[1] && ctx.match[2]) {
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
        return
      }
      if (ctx.match[1] == 'all' && postItem.content.length > 4000) {
        ctx.answerCbQuery('全文内容过长，请访问原文链接进行查看。', true)
        return
      }
      let attachmentNum = (await postItem.getAttachments()).length
      let attachmentButton = attachmentNum > 0 ? [Markup.callbackButton(`📎 ${attachmentNum} 附件`, `att|${postItem.id}`)] : []
      ctx.editMessageText(
        `#学院通知 ${
        N}*${ postItem.title }* ${
        N} ${
        N}${ ctx.match[1] == 'all' ? postItem.content : ctx.match[1] == 'less' ? postItem.excerpt : '' } ${
        N} ${
        N}#${ postItem.category.site.name } #${ postItem.category.name } ${
        N}发布日期：${ postItem.publishDate } ${
        N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }`, 
        Extra.markdown()
          .notifications(false)
          .webPreview(false)
          .markup((m) => {
            let callbackButton
            if (ctx.match[1] == 'all') {
              callbackButton = m.callbackButton('↑ 收起', `less|${postItem.id}`)
            } else if (ctx.match[1] == 'less') {
              callbackButton = m.callbackButton('↓ 全文', `all|${postItem.id}`)
            } else {
              // Not Valid
              return
            }
            return m.inlineKeyboard([
              callbackButton,
              m.urlButton('🔗 链接', postItem.url),
              ...attachmentButton
            ])
          })
      )
    }
    ctx.answerCbQuery()
  },
  async attachmentCb(ctx, Database) {
    let postItem = await Database.Post.findOne({
      where: {
        id: ctx.match[1]
      },
      include: [
        {
          model: Database.Category,
          include: [Database.Site]
        },
        Database.Attachment
      ]
    })
    let attachmentList = await postItem.getAttachments()
    if (attachmentList.length == 0) {
      ctx.answerCbQuery('该通知没有对应的附件，请查证后再点。', true)
      return
    }
    ctx.editMessageText(
      `#学院通知 ${
      N}附件列表 - *${ postItem.title }* ${
      N} ${
      N}${ attachmentList.map(attachmentItem => {
        return `- [${attachmentItem.name}](${attachmentItem.url})`
      }).join('\n\n') } ${
      N} ${
      N}#${ postItem.category.site.name } #${ postItem.category.name } ${
      N}发布日期：${ postItem.publishDate } ${
      N}抓取时间：${ moment(postItem.createdAt).format('YYYY/MM/DD HH:mm:ss') }`, 
      Extra.markdown()
        .notifications(false)
        .webPreview(false)
        .markup((m) => {
          return m.inlineKeyboard([
            m.callbackButton('🔙 返回', `less|${postItem.id}`)
          ])
        })
      )
      ctx.answerCbQuery()
    // let attachmentButton = attachmentList > 0 ? [Markup.callbackButton(`📎 ${attachmentNum}附件`, `att|${postItem.id}`)] : []
  }
}