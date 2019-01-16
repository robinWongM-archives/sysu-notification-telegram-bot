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
    },
    dialectOptions: {
      typeCast: function (field, next) { // for reading from database
        if (field.type === 'DATETIME') {
          return field.string()
        }
        return next()
      },
    },
    timezone: '+08:00', // for writing to database

    logging: false
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
  },
  userName: {
    type: Sequelize.STRING
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
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
    type: Sequelize.TEXT
  },
  title: {
    type: Sequelize.TEXT
  },
  content: {
    type: Sequelize.TEXT
  },
  excerpt: {
    type: Sequelize.TEXT
  },
  publishDate: {
    type: Sequelize.STRING
  },
})

const Attachment = sequelize.define('attachment', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.TEXT
  },
  url: {
    type: Sequelize.TEXT
  },
  fileType: {
    type: Sequelize.TEXT
  },
  fileId: {
    type: Sequelize.INTEGER
  }
})

User.belongsToMany(Category, {
  through: 'user_category'
})
Category.belongsToMany(User, {
  through: 'user_category'
})

Site.hasMany(Category)
Category.belongsTo(Site)

Category.hasMany(Post)
Post.belongsTo(Category)

Post.hasMany(Attachment)
Attachment.belongsTo(Post)

// Remember to invoke sequelize.sync()
module.exports = {
  sequelize,
  Sequelize,
  User,
  Site,
  Category,
  Post,
  Attachment
}