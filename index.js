const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const axios = require('axios')

const app = express()

const SVARA_AUTH = 'svara-oauth'
const SVARA_URL_GET_TOKEN = 'https://api.svara.id/dev/apps/auth/login'
const SVARA_URL_LOGIN = 'https://api.svara.id/dev/auth/login'

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.get('/auth/email', (req, res) => {
  res.sendFile('login_form.html', { root: __dirname + '/public' })
})

app.post('/auth/validation', (req, res) => {
  console.log('✅ POST /auth/validation')
  // console.log('REQUEST NYA:', req)
  res.status(200).send()
})

app.get('/auth/validation', (req, res) => {
  console.log('✅ GET /auth/validation')
  res.status(200).send()
})

app.post('/auth/email', async (req, res) => {
  try {
    const { username, password } = req.body

    const getLoginToken = await axios.post(SVARA_URL_GET_TOKEN, {
      username: SVARA_AUTH,
      password: SVARA_AUTH,
    })

    const { data: tokenData } = getLoginToken
    const { accessToken: loginToken } = tokenData

    const login = await axios.post(
      SVARA_URL_LOGIN,
      {
        username,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginToken}`,
        },
      }
    )
    console.log('✅ LOGIN SUCCESS')

    const {
      // userId,
      accessToken: token,
    } = login.data

    console.log('✅ accessToken:', token)

    const redirectURL = encodeURI(
      `https://odoo.officely.id/auth_oauth/signin?scope=email&state={"d":"bitnami_odoo","p":4,"r":"https://odoo.officely.id/web"}&access_token=${token}`
    )

    console.log('✅ redirect URL:', redirectURL)
    res.redirect(
      // `https://odoo.officely.id/auth_oauth/signin#state={"userId":"${userId}"}&access_token=${token}`
      redirectURL
    )
  } catch (e) {
    console.error(e.message)
    res.status(500).send(e.message)
  }
})

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`Sever is listening on port ${port} | http://localhost:5000`)
})
