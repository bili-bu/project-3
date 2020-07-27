### ![GA](https://cloud.githubusercontent.com/assets/40461/8183776/469f976e-1432-11e5-8199-6ac91363302b.png) General Assembly, Software Engineering Immersive
# TRIVIA GAME 

## Overview

This project was our third project during our time at General Assembly. We were paired in a team of four and were tasked to create a full-stack MERN application in 10 days. We were given creative free range with regards to the kind of application we wanted to build. We decided as a team that we wanted to make a fun interactive game application and had come across an external API called OpenTriviaDB with multiple choice and true of false trivia questions which we thought would be a good idea to utilize. So we created the game and stored user information, scores and comments on our back end.

You can launch the site on Heroku [here](https://trivia-game-alex.herokuapp.com/register).

### The Brief 

- **Work in a team, using git to code collaboratively.**
- **Build a full-stack application by making the backend and the front-end**
- **Use an Express API to serve data from a Mongo database**  
- **Consume the API with a separate front-end built with React** 
- **Be a complete product which most likely means multiple relationships and CRUD functionality for at least a couple of models** 

### The Approach 

We decided to use both an external API and our own database to store user information in the backend. It was important for us to choose an API with a structure that we could understand well. We deceided to use a Open Source REST [API](https://opentdb.com/api_config.php) to fetch our questions and answers for the quiz. 

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

## The Backend

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

### 1.Models

We needed to create two models for our MVC which would be vital for data storgae in the backend. The first model consists of two schemas: a **(user) schema** and a **score schema**, where the score schema is embedded in the user schema so as to always associate a score for right answers and a score for wrong answers with a user. To prevent people registering with the same username or email, we used the **mongoose-unique-validator**.

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
}
```

**Comment Model**

The second model consists of the **(comment) schema**. Any comment that gets generated is always associated with a specific user which allows us to group comments by registered user. 

```js
const schema = new mongoose.Schema({
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true } 
})
```

### 2. Controllers

Given that we had two models, we were bound to have to create two controllers one for the user (userController.js) and one for the comments (commentController.js). All of the functions take a **req** and a **res** which are the requests sent to the API and the response received.

**User:**

The user controller consists of five functions:

- function register
- function login
- function addToScore
- function getUserInfo
- function index

Most of these functions are pretty self-explanatory. It's interesting to note that after each game of ten answered questions the `addToScore` function gets called and the score of the most recently completed game gets added to the exisitng score in the user profile. This way the user profile always carries the compounded historical score for each registered player. See the full function below.

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

We use the `index` function for our leaderboard in the front-end of the application (more on that below). This function simply gets the information for all users in the API. 

```js
function index (req, res) {
  User
    .find()
    .then(users => {
      res.send(users)
    })
}
```

We had plans to have a function for editing user profile information but due to time constraints we didn't get around to creating one. 

**Comment:**

The comment controller consists of three functions:

- function allComments
- function commentCreate
- function commentDelete

As per the model, each time a user posts a comment in the comments section, it will be stored in the API and can also be deleted from there.


### 3. Security and encryption

Looking at the `router.js` file, you can see that a number of our API Endpoints pass through a secure route which has been created in the `secureRoute.js` file to ensure that the user is authorised when accessing those endpoints. As you can see from the below example, all registered users are able to view the rankings of the leaderboard, since we wanted users to be able to compare themselves with their peers. 

```js
router.route('/users')
  .get(userController.index)
```
In comparison, the endpoint for comment deletion is secured since we wanted to limit users deleting comments that were not theirs.

```js
router.route('/comments/:commentId')
  .delete(secureRoute, commentController.commentDelete)
```

Below the secureRoute setup:

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

The function is looking for and comparing the JWT (Jason Web Token) that is assigned to each user upon login. If say, the user who is trying to delete a comment doesn't have the same token as the user associated with the comment, he will not be able to proceed. Inversely, should the token be the same, the user will be able to delete the comment.

Please see below the code for adding a token during login which can be found in the login function of the `userController.js`:

```js
const token = jwt.sign({ sub: user._id }, secret, { expiresIn: '48h' } )
      res.status(202).send({ message: `Welcome back ${user.username}`, token })
```

This token will expire in 48 hours, which means that a user remains logged in for 48 hours unless they voluntarily log out before this time period is over. It is common practice to have tokens expire in a shorter timeframe (12 hours) but for our ease of access while building the application we kept the expiry timeframe longer.

Please also note the mention of a secret in the above code. This is an extra security measure that was implementd to add an extra layer of security. The secret is stored in the `environment.js` file and is only accessible to the developers of the application.

Another additional measure of security is the use of an encryption library called **Bcrypt**. We make use of bcrypt in the user model. When a new user registers for our application, naturally all of the information they provided is saved to the database. But before the password is saved to the database, the library will hash the password and store it as such in the database.  

```js
schema
  .pre('save', function hashPassword(next) {
    if (this.isModified('password')) {
      this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync())
    }
    next()
  })
```

## The Frontend

We decided to design our app with mobile-first view when building the game. It was built using React and has 11 components.

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