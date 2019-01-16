let cachedUsers = {}

module.exports = (Database) => {
  return async (ctx, next) => {
    const key = `${ctx.from.id}:${ctx.chat.id}`
    if (!cachedUsers[key]) {
      [cachedUsers[key]] = await Database.User.findOrCreate({
        where: {
          telegramId: ctx.from.id,
          chatId: ctx.chat.id
        },
        defaults: {
          telegramId: ctx.from.id,
          chatId: ctx.chat.id,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          userName: ctx.from.username
        },
        include: [
          Database.Category
        ]
      })
    }
    Object.defineProperty(ctx, 'user', {
      get: () => { 
        return cachedUsers[key].get()
      },
      set: (newValue) => {
        cachedUsers[key].set(newValue)
        cachedUsers[key].save()
      }
    })
    await next()
  }
}