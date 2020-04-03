const mongoose = require('mongoose')
const User = require('./models/user')
const { dbURI } = require('./config/environment')

mongoose.connect(
  dbURI,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  (error, db) => {
    if (error) {
      return console.log(error)
    }
    console.log('Successfully connected to mongo!')
    db.dropDatabase()
      .then(() => {
        return User.create([
          {
            username: 'Alex',
            email: 'alex@alex.com',
            password: 'alex',
            passwordConfirmation: 'alex',
            score: {
              right: 0,
              wrong: 0
            }
          },
          {
            username: 'Fortuny',
            email: 'fortuny@fortuny.com',
            password: 'fortuny',
            passwordConfirmation: 'fortuny',
            score: {
              right: 0,
              wrong: 0
            }
          },
          {
            username: 'Yara',
            email: 'yara@yara.com',
            password: 'yara',
            passwordConfirmation: 'yara',
            score: {
              right: 0,
              wrong: 0
            }
          },
          {
            username: 'David',
            email: 'david@david.com',
            password: 'david',
            passwordConfirmation: 'david',
            score: {
              right: 0,
              wrong: 0
            }
          }
        ])
      })
      .then(user => console.log(`${'😃'.repeat(user.length)} created`))
      .then(() => console.log('Goodbye...'))
      .catch(err => console.log(err))
      .finally(() => mongoose.connection.close())
  }
)