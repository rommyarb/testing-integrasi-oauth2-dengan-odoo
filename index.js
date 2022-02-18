require('dotenv').config()

const express = require('express')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook').Strategy

const DATA_DUMMY = [{ email: 'test@gmail.com', password: '1234' }]

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(passport.initialize())

const jwt = require('jsonwebtoken')
const JwtStrategy = require('passport-jwt').Strategy

const opts = {}
opts.jwtFromRequest = function (req) {
  let token = null
  if (req && req.cookies) {
    token = req.cookies['jwt']
  }
  return token
}
opts.secretOrKey = 'secret'

passport.use(
  new JwtStrategy(opts, function (jwt_payload, done) {
    console.log('JWT nya:', jwt_payload)
    if (CheckUser(jwt_payload.data)) {
      return done(null, jwt_payload.data)
    } else {
      return done(null, false)
    }
  })
)

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/googleRedirect`,
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(accessToken, refreshToken, profile)
      return cb(null, profile)
    }
  )
)

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env['FACEBOOK_CLIENT_ID'],
      clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
      callbackURL: `${process.env.BASE_URL}/facebookRedirect`,
      profileFields: ['id', 'displayName', 'email', 'picture'],
    },
    function (accessToken, refreshToken, profile, cb) {
      return cb(null, profile)
    }
  )
)

passport.serializeUser(function (user, cb) {
  cb(null, user)
})

passport.deserializeUser(function (obj, cb) {
  cb(null, obj)
})

app.get('/', (req, res) => {
  res.sendFile('home.html', { root: __dirname + '/public' })
})

app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: __dirname + '/public' })
})

app.get('/auth/email', (req, res) => {
  res.sendFile('login_form.html', { root: __dirname + '/public' })
})

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }))

app.post('/auth/email', (req, res) => {
  if (CheckUser(req.body)) {
    let token = jwt.sign(
      {
        data: req.body,
      },
      'secret',
      { expiresIn: '1h' }
    )
    res.cookie('jwt', token)
    res.send(`Log in success ${req.body.email}`)
  } else {
    res.send('Invalid login credentials')
  }
})

app.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { email } = req.user
    const { cookies } = req
    res.send(
      `PROFIL<br/>===========<br/><br/>Email Anda: <b>${email}</b><br/>Token: <b>${cookies.jwt}</b><br/>`
    )
  }
)

app.get('/googleRedirect', passport.authenticate('google'), (req, res) => {
  let user = {
    displayName: req.user.displayName,
    name: req.user.name.givenName,
    email: req.user._json.email,
    provider: req.user.provider,
  }

  FindOrCreate(user)
  let token = jwt.sign(
    {
      data: user,
    },
    'secret',
    { expiresIn: '24h' }
  )
  res.cookie('jwt', token)
  res.redirect('/profile')
})
app.get(
  '/facebookRedirect',
  passport.authenticate('facebook', { scope: 'email' }),
  (req, res) => {
    let user = {
      displayName: req.user.displayName,
      name: req.user._json.name,
      email: req.user._json.email,
      provider: req.user.provider,
    }

    FindOrCreate(user)
    let token = jwt.sign(
      {
        data: user,
      },
      'secret',
      { expiresIn: 60 }
    )
    res.cookie('jwt', token)
    res.redirect('/')
  }
)

function FindOrCreate(user) {
  if (CheckUser(user)) {
    return user
  } else {
    // insert?
    DATA_DUMMY.push(user)
  }
}
function CheckUser(input) {
  for (const i in DATA_DUMMY) {
    if (
      input.email == DATA_DUMMY[i].email &&
      (input.password == DATA_DUMMY[i].password ||
        DATA_DUMMY[i].provider == input.provider)
    ) {
      return true
    } else null
  }
  return false
}

app.listen(process.env.PORT, () => {
  console.log(`🏃‍♂️ Berjalan di port ${process.env.PORT}`)
})
