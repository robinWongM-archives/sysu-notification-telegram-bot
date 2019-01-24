const debug = require('debug')('SYSUBOT_Fetch_Post')

const Helper = require('./helper.js')
const Attachment = require('./attachment.js')

const got = require('got')
const cheerio = require('cheerio')

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
  replacement: content => '_（表格内容，请访问原文链接查看）_'
})

module.exports = async function (url, date, category, Database, Bot, ParseType) {
  let html = (await got(url)).body
  let $ = cheerio.load(html)

  let [postItem, wasCreated] = await Database.Post.findOrCreate({
    where: {
      url,
      title: Helper.getItem($, ParseType.post.title),
      publishDate: date
    }
  })

  if (wasCreated) {
    debug('Detected new post', postItem.title, postItem.publishDate)

    postItem.content = turndownService.turndown(Helper.getItem($, ParseType.post.content))
    postItem.excerpt = postItem.content.split('\n').slice(0, 2).join('\n')
    debug('Excerpt', postItem.excerpt)

    let attachmentList = []
    Helper.getItem($, ParseType.attachment.container).each((i, el) => {
      attachmentList.push($(el))
    })

    for (let attachment of attachmentList) {
      let [attachmentItem, wasCreated] = await Attachment(attachment, Database, Bot, ParseType)
      if (wasCreated) {
        postItem.addAttachment(attachmentItem)
      }
    }
  }

  return [postItem, wasCreated]
}