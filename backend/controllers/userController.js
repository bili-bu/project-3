const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { secret } = require('../config/environment')

function register(req, res, next) {
  console.log(req.body)
  User
    .create(req.body)
    .then(user => res.status(200).send(user)) 
    .catch(next)
}

function login(req, res) {
  User
    .findOne({ email: req.body.email })
    .then(user => {
      if (!user.validatePassword(req.body.password)){
        return res.status(401).send({ message: 'Unauthorized' })
      }
      const token = jwt.sign({ sub: user._id }, secret, { expiresIn: '48h' } )
      res.status(202).send({ message: `Welcome back ${user.username}`, token })
    })
}

function index (req, res) {
  User
    .find()
    .then(users => {
      res.send(users)
    })
}

function getUserInfo(req, res) {
  const id = req.params.id
  User
    .findById(id)
    .then(userInfo => {
      res.send(userInfo)
    })
}


function addToScore(req, res) {
  const currentUser = req.currentUser.id
  User
    .findById(currentUser)
    .then(user => {
      const userRight = user.score.right + req.body.score.right
      const userWrong = user.score.wrong + req.body.score.wrong
      req.body.score.right = userRight 
      req.body.score.wrong = userWrong 
      return user.set(req.body)
    })
    .then(user => {
      return user.save()
    })
    .then(user => {
      res.status(202).send(user)
    })
}

module.exports = {
  register,
  login,
  index,
  getUserInfo,
  addToScore
}