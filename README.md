### ![GA](https://cloud.githubusercontent.com/assets/40461/8183776/469f976e-1432-11e5-8199-6ac91363302b.png) General Assembly, Software Engineering Immersive
# TRIVIA GAME 

## Overview

This project was our third project during our time at General Assembly. We were paired in a team of four and were tasked to create a full-stack MERN application in 10 days. We were given creative free range with regards to the kind of application we wanted to build. We decided as a team that we wanted to make a fun interactive game application and had come across an external API called OpenTriviaDB with multiple choice and true of false trivia questions which we thought would be a good idea to utilize. So we created the game and stored user information, scores and comments on our back end.

You can launch the site on Heroku [here](https://trivia-game-alex.herokuapp.com/).

### The Brief 

- **Work in a team, using git to code collaboratively.**
- **Build a full-stack application by making the backend and the front-end**
- **Use an Express API to serve data from a Mongo database**  
- **Consume the API with a separate front-end built with React** 
- **Be a complete product which most likely means multiple relationships and CRUD functionality for at least a couple of models** 

### Technologies Used 

- HTML5
- CSS3
- JavaScript (ES6)
- React.js
- Express
- Mongo and Mongoose
- Git and GitHub
- Google Fonts
- SASS
- Heroku

## The Approach 

We decided to use both an external API and our own database to store user information in the backend. It was important for us to choose an API with a structure that we could understand well. We deceided to use a Open Source REST [API](https://opentdb.com/api_config.php) to fetch our questions and answers for the quiz. 

### The Backend

The backend was built following the conventional MVC model. When creating our backend, the first step we took as a team was to decide the structure of our backend and which components we would need to build out. Below is the list of components we agreed should be part of our MVC: 

- Models (comment.js and user.js)
- View (router.js)
- Controllers (commentController.js and userController.js)

To start off our model we created a seed.js file with some users which would make it easy for us to navigate our website. To make it as easy as possible we used our four team members as seed users. Below an example:

```js
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
          }
```

After this was completed, we were able to tackle the MVC.

1. **Models**

We created two models which we knew we would need for our backend. 

**Comment Model**

```js
const schema = new mongoose.Schema({
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User', require: true } 
})

```
**User Model**

```js
const scoreSchema = new mongoose.Schema({
  right: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 }
})

const schema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  score: scoreSchema
},

{
  toJSON: {
    transform(doc, json) {
      return {
        email: json.email,
        username: json.username,
        id: json._id,
        score: json.score
      }
    }
  }
})

schema.plugin(require('mongoose-unique-validator'))
schema
  .virtual('passwordConfirmation')
  .set(function setPasswordConfirmation(passwordConfirmation) {
    this._passwordConfirmation = passwordConfirmation
  })

schema
  .pre('validate', function checkPassword(next) {
    if (this.isModified('password') && this._passwordConfirmation !== this.password) {
      this.invalidate('passwordConfirmation', 'should match')
    }
    next()
  })

schema
  .pre('save', function hashPassword(next) {
    if (this.isModified('password')) {
      this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync())
    }
    next()
  })

schema.methods.validatePassword = function validatePassword(password) {
  return bcrypt.compareSync(password, this.password)
}
```

**The Endpoints**

User:

- `/register`

From the Register component we are posting to the register endpoint.


```js
function register(req, res, next) {
  console.log(req.body)
  User
    .create(req.body)
    .then(user => res.status(200).send(user)) 
    .catch(next)
}
```
- `/login`

From the Login component we are posting to the login endpoint.

```js
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
```

- `/display-score`

From the DisplayScore component we are putting to the addToScore endpoint.

```js
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

```

- `/profile`

From the Profile component we are getting from the getUserInfo endpoint.

```js
function getUserInfo(req, res) {
  const id = req.params.id
  User
    .findById(id)
    .then(userInfo => {
      res.send(userInfo)
    })
}

```

- `/leader-board`

From the LeaderBoard component we are getting from the index endpoint.

```js
function index (req, res) {
  User
    .find()
    .then(users => {
      res.send(users)
    })
}
```

Comment:

  - `Comment`

  From the Comments component we are getting all comments, posting and deleting, from their respective endpoints.

  ```js
  function allComments (req, res) {
  Comment
    .find()
    .populate('user')
    .then(post => {
      res.send(post)
    })
}

function commentCreate(req, res){
  req.body.user = req.currentUser
  Comment
    .create(req.body)
    .then(post => {
      res.status(201).send(post)
    })
}

function commentDelete(req, res) {
  Comment
    .findById(req.params.commentId)
    .then(post => {
      if (!post) return res.status(401).send({ message: 'Unauthorized' })
      return post.remove()
    }) 
    .then(() => res.status(200).json({ message: 'comment deleted' }))
    .catch(err => console.log(err))
}
```
  
**SECURE ROUTE**

A number of the API Endpoints need to pass through a secure route to ensure that the user is authorised. An example of how this looks in the router is below:

```js
router.route('/user/:id')
  .get(userController.getUserInfo)
  .put(secureRoute, userController.addToScore)

```

You need to be authorized to put (edit) the user info but not to get.

We need a JSON Web Token for this. When a user logs in, they are assigned a token:

```js

const token = jwt.sign({ sub: user._id }, secret, { expiresIn: '48h' } )
      res.status(202).send({ message: `Welcome back ${user.username}`, token })

```
When the token is received by our front-end, it is saved to local storage:

```js
function setToken (token) {
  localStorage.setItem('token', token)  
}
```

And we get the token and include it in the header of any of our requests to the API:

```js
function getToken() {
  return localStorage.getItem('token')
}
```

Below is how the SecureRoute is setup:

```js
function secureRoute(req, res, next) {
  const authToken = req.headers.authorization
  if (!authToken || !authToken.startsWith('Bearer')) {
    return res.status(401).send({ message: 'Unauthorized' })
  }
  const token = authToken.replace('Bearer ', '')
  jwt.verify(token, secret, (err, payload) => {
    if (err) return res.status(401).send({ message: 'Unauthorized' })
    User
      .findById(payload.sub)
      .then(user => {
        if (!user) return res.status(401).send({ message: 'Unauthorized' })
        req.currentUser = user
        next()
      })
      .catch(() => res.status(401).send({ message: 'Unauthorized' }))
  })
}
```

## The Frontend

We decided to design our app with mobile-first view when bulding the game. It was built using React and has 11 components.

<img  src=frontend/src/styles/images/quiz.png height=300> <img  src=frontend/src/styles/images/login.png height=300> <img  src=frontend/src/styles/images/multiple-choice.png height=300>

**COMPONENTS**

- `Register.js` and `Login.js`

The information entered by the user in the registration and login forms is set as state and then posted to our backed endpoints through  `/api/register` and `/api/login`. 

`Register.js`

```js
class Register extends React.Component {

  constructor() {
    super()
    this.state = {
      data: {
        email: '',
        username: '',
        password: '',
        passwordConfirmation: '',
        score: {
          right: 0,
          wrong: 0
        }
      },
      errors: {}
    }
  }

  handleChange(event) {
    const { name, value } = event.target
    const data = { ...this.state.data, [name]: value }
    this.setState({ data })
  }

  handleSubmit(event) {
    event.preventDefault()
    axios.post('/api/register',
      this.state.data)
      .then(() => this.props.history.push('/login'))
  }
```

`Login.js`

```js
class Login extends React.Component {

  constructor() {
    super()
    this.state = {
      data: {
        email: '',
        password: ''
      }
    }
  }

  handleChange(event) {
    const { name, value } = event.target
    const data = { ...this.state.data, [name]: value }
    this.setState({ data })
  }

  handleSubmit(event) {
    event.preventDefault()
    axios.post('/api/login',
      this.state.data)
      .then(res => {
        const token = res.data.token
        auth.setToken(token)
        this.props.history.push('/quizzes')
      })
  }
```

- `MultipleChoice.js` and `TrueOrFalse.js` 

We are fetching an array of incorrect answers and we are inserting the correct answer at a random index in that array.

So now we have an array of answers and we can just render them and the correct answer will always be at random position. 

When a player clicks on an answer, the function `handlePlayerClick()` will check if the `innerHTML` of the selected answer matches the `innerHTML` of the correct answer. If it does the button will turn green. If it doesn't the button will turn red and we are using Ref to identify the button with the correct answer and change it to green.

Everytime a player clicks on an answer, we are saving their total of right and wrong answers to `localStorage`. When the user has finished the quiz (answer 10 questions), we get our totals from `localStorage` to display their score.

```js
handlePlayerClick(event) {
    if (event.target.innerHTML === this.state.wholeQuestion.results.map((e) => (e.correct_answer))[0]) {
      event.target.style.backgroundColor = 'green'
      rightAnswers++
      localStorage.setItem('right', rightAnswers)
      totalAnswered = rightAnswers + wrongAnswers
    } else {
      event.target.style.backgroundColor = 'red'
      wrongAnswers++
      localStorage.setItem('wrong', wrongAnswers)
      totalAnswered = rightAnswers + wrongAnswers
      if (this.AnswerA.innerHTML === this.state.wholeQuestion.results.map((e) => (e.correct_answer))[0]) {
        this.AnswerA.style.backgroundColor = 'green'
      } else if (this.AnswerB.innerHTML === this.state.wholeQuestion.results.map((e) => (e.correct_answer))[0]) {
        this.AnswerB.style.backgroundColor = 'green'
      } else if (this.AnswerC.innerHTML === this.state.wholeQuestion.results.map((e) => (e.correct_answer))[0]) {
        this.AnswerC.style.backgroundColor = 'green'
      } else if (this.AnswerD.innerHTML === this.state.wholeQuestion.results.map((e) => (e.correct_answer))[0]) {
        this.AnswerD.style.backgroundColor = 'green'
      }
    }
    if (totalAnswered === 10) {
      setTimeout(() => {
        this.props.history.push('/display-score')
        rightAnswers = 0
        wrongAnswers = 0
        totalAnswered = 0
      }, 400)
    } else {
      axios.get('https://opentdb.com/api.php?amount=1&type=multiple')
        .then(res => this.setState({ wholeQuestion: res.data }))
      setTimeout(() => {
        this.AnswerA.style.backgroundColor = 'buttonface'
        this.AnswerB.style.backgroundColor = 'buttonface'
        this.AnswerC.style.backgroundColor = 'buttonface'
        this.AnswerD.style.backgroundColor = 'buttonface'
      }, 400)
    }
  }
```

 - `DisplayScore.js`

After we get the player's score from `localStorage`, we use a put method to add it to our user information in the backend.

```js
class DisplayScore extends React.Component {

  constructor() {
    super()
    this.state = {
      score: {
        right: parseInt(localStorage.getItem('right')),
        wrong: parseInt(localStorage.getItem('wrong'))
      }
    }
  }

  componentDidMount() {
    const id = auth.getUserId()
    axios.put(`/api/user/${id}`,
      this.state,
      { headers: { Authorization: `Bearer ${auth.getToken()}` } })
  }
```

- `Comments.js` and `NewComment.js`

In the `NewComment.js` component users write their comments in a form and then, through the `handleSubmit()` function, we are posting it to our backend endpoint `/api/comments`. 

```js
  handleSubmit(event) {
    event.preventDefault()
    axios.post('/api/comments',
      this.state,
      { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(() => location.reload())
  }
  render() {
    return <div>
      <form
        className='formForComments'
        onSubmit={this.handleSubmit(event)}>
        <textarea
          className='inputComment'
          onChange={this.handleChange(event)}
          type="text"
        >
        </textarea>
        <button className='submitButton'>Comment ⌨️</button>
      </form>
    </div>
  }
```

In the `Comment.js` component we are getting the information from our previous post, and we are adding a `handleDelete()` function, which is allowing logged-in users to delete their own comments but not other users'. We check if a comment belongs to the current user with the Authorization method. 


```js
  componentDidMount() {
    axios.get('/api/comments')
      .then(res => {
        this.setState({ comments: res.data.reverse() })
      })
  }

  handeleDelete(comment) {
    const id = comment._id
    axios.delete(`/api/comments/${id}`,
      { headers: { Authorization: `Bearer ${auth.getToken()}` } })
      .then(() => location.reload())
  }

  isOwner(comment) {
    return auth.getUserId() === comment.user.id
  }
```

## Challenges

- One of our main challenges was figuring out how to associate a user with their scores. We had to try a few different model structures before we finally decided to have a user model and keep the scores there.

- Some of the game logic in the frontend was definitely mindbending. Especially displaying the right answer when the player clicks on the wrong answer was tricky. But it was interesting to learn about Refs.

- The API we were fetching our questions from had special coded characters that were not displaying correctly in our app. We tried many ways to fix this issue but nothing was working. We ended up having to replace each character manually which was long and messy.

## Successes

- Since this was our first full-stack application, working on every part of the project from idea planning to deployment was very rewarding. Seeing that we were able to create an entire application with frontend and backend was a great satisfaction.
 
- This was also our first time working as a group with Git. Learning about how to avoid conflicts and put everyone’s work together was demanding at the beginning, but proved to be very useful for group collaboration.

- Overcoming the limits of working remotely from home.

## Potential Future Features

- Maybe a timer to answer a question in a limited time.

- We were thinking about displaying the ranking in percentages instead of correct answers, to make it more independent from the number of games. Since that didn't satisfy us very much, we were thinking about maybe having a new point system.