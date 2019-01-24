const debug = require('debug')('Fetch_Attachment')

const Helper = require('./helper.js')

const got = require('got')
const cheerio = require('cheerio')

module.exports = async function($, Database, Bot, ParseType) {
  let [attachmentItem, wasCreated] = await Database.Attachment.findOrCreate({
    where: {
      name: Helper.getItem($, ParseType.attachment.name),
      url: Helper.getItem($, ParseType.attachment.url),
      fileType: Helper.getItem($, ParseType.attachment.fileType)
    }
  })

  return [attachmentItem, wasCreated]
}