const got = require('got')
const cheerio = require('cheerio')

module.exports = async function(Database, Telegram) {
  let categoryList = await Database.Category.all({
    include: [Database.Site]
  })

  for (category of categoryList) {
    let html = (await got(`https://${ category.site.domain }/${ category.path }`)).body
    let $ = cheerio.load(html)
    $('.full-page-list ul li').each(async (i, el) => {
      let link = $(el).children('a')
      let [postItem, wasCreated] = await Database.Post.findOrCreate({
        where: {
          url: `https://${ category.site.domain }${ link.attr('href') }`,
          title: link.text()
        }
      })
      if (wasCreated) {
        category.addPost(postItem)
        let userList = await Database.User.all()
        for (let user of userList) {
          Telegram.sendMessage(user.chatId, `[${postItem.title}](${postItem.url})`, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          })
        }
      }
      //console.log(link.text(), `https://${ category.site.domain }${ link.attr('href') }`)
    })
  }
}