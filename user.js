let cachedUsers = {}

module.exports = (Database) => {
  return async (ctx, next) => {
    const key = `${ctx.chat.id}`

    let userInfo = {}
    switch (ctx.chat.type) {
      case 'private':
        userInfo = {
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          userName: ctx.from.username
        }
        break
      case 'group':
      case 'supergroup':
      case 'channel':
        userInfo = {
          title: ctx.chat.title
        }
    }

    if (!cachedUsers[key]) {
      [cachedUsers[key]] = await Database.User.findOrCreate({
        where: {
          chatId: ctx.chat.id,
          type: ctx.chat.type
        },
        include: [
          Database.Category
        ]
      })
    }
    cachedUsers[key].update({
      chatId: ctx.chat.id,
      type: ctx.chat.type,
      ...userInfo
    })
    Object.defineProperty(ctx, 'user', {
      get: () => { 
        return cachedUsers[key]
      },
      set: (newValue) => {
        cachedUsers[key].set(newValue)
        cachedUsers[key].save()
      }
    })
    await next()
  }
}