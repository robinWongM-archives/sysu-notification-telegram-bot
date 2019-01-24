const debug = require('debug')('SYSUBOT_Fetch_List')

const Helper = require('./helper.js')
const Post = require('./post.js')
const BotShortcut = require('../bot-shortcut/index.js')

const got = require('got')
const cheerio = require('cheerio')

module.exports = async function (category, Database, Bot, ParseType) {
  try {
    const parseType = ParseType[category.parseType]

    let html = (await got(`http://${ category.site.domain }/${ category.path }`)).body
    let $ = cheerio.load(html)

    let notificationList = []
    Helper.getItem($, parseType.list.item).each((i, el) => {
      notificationList.push($(el))
    })

    for (let notification of notificationList.reverse().slice(0, 3)) {
      let url = `http://${ category.site.domain }${ Helper.getItem(notification, parseType.list.url) }`
      let date = Helper.getItem(notification, parseType.list.date)

      let [postItem, wasCreated] = await Post(url, date, category, Database, Bot, parseType)
      if (wasCreated) {
        await category.addPost(postItem)
        await postItem.setCategory(category)

        await category.save()
        await postItem.save()
        debug('Testing 1')
        await BotShortcut.broadcastPost(postItem, Bot)
        debug('Testing 2')
      }
    }
  } catch (err) {
    debug.extend('ERROR')(err, err.stack)
  }
}