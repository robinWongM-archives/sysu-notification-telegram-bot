const Sequelize = require('sequelize')

const sequelize = new Sequelize(
  process.env.SYSU_BOT_DATABASE_NAME,
  process.env.SYSU_BOT_DATABASE_USER,
  process.env.SYSU_BOT_DATABASE_PWD,
  {
    host: process.env.SYSU_BOT_DATABASE_HOST || 'localhost',
    dialect: 'mysql',

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

// Define models & Sync
const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  telegramId: {
    type: Sequelize.INTEGER
  },
  chatId: {
    type: Sequelize.INTEGER
  }
})

const Site = sequelize.define('site', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  },
  domain: {
    type: Sequelize.STRING
  }
})

const Category = sequelize.define('category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING
  },
  path: {
    type: Sequelize.STRING
  },
  updateInterval: {
    type: Sequelize.INTEGER
  },
  parseType: {
    type: Sequelize.ENUM('sdcs')
  },
  lastUpdate: {
    type: Sequelize.TIME
  }
})

const Post = sequelize.define('post', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: Sequelize.STRING
  },
  title: {
    type: Sequelize.STRING
  }
})

User.belongsToMany(Category, {
  through: 'userCategory'
})
Category.belongsToMany(User, {
  through: 'userCategory'
})

Site.hasMany(Category)
Category.belongsTo(Site)

Category.hasMany(Post)
Post.belongsTo(Category)

// Remember to invoke sequelize.sync()
module.exports = {
  sequelize,
  Sequelize,
  User,
  Site,
  Category,
  Post
}