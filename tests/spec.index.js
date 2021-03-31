const { expect } = require('chai')
const { Course, User } = require('../models')
const axios = require('axios')

/**
 * Function creates and returns an axios configuration object based on the params passed in
 * @param {string} username contains the users email address
 * @param {string} password contains the users password
 * @param {string} url contains the url axios will send the info to
 * @param {string} method contains the type of request (get, put, post, delete)
 * @param {object} data contains the data to be submitted to the database
 * Credit to srijan439 for the solution https://stackoverflow.com/questions/44072750/how-to-send-basic-auth-with-axios 
 */
function createToken (username, password, url, method, data) {
  const token = `${username}:${password}`
  const encodedToken = Buffer.from(token).toString('base64')
  return { method: method, url: url, data: data, headers: { 'Authorization': 'Basic '+ encodedToken } }
}

describe('The API meets expectations', () => {
  // Test user info
  const testEmail = 'test@email.com'
  const testFName = 'fName'
  const testLName = 'lName'
  const testPW = 'testPassword'

  // Joe's user info
  const joeEmail = 'joe@smith.com'
  const joePW = 'joepassword'

  describe('USERS - test the users routes', () => {
    let res
    let authenticatedUser
    it('GET - the get route will return the currently authenticated user', async () => {
      const axiosConfig = createToken(joeEmail, joePW, 'http://localhost:5000/api/users', 'get')
      authenticatedUser = await axios(axiosConfig)
      expect(authenticatedUser.data.user.emailAddress).to.equal(joeEmail)
    })
    it('The GET test will return a 200 status code', () => {
      expect(authenticatedUser.status).to.equal(200)
    })
    it('POST - the post route will create a new user', async () => {
      let actual
      try {
        const data = {
          firstName: testFName,
          lastName: testLName,
          emailAddress: testEmail,
          password: testPW
        }
        res = await axios.post('http://localhost:5000/api/users', data)
        actual = await User.findOne({ where: { emailAddress: testEmail } })
        actual = actual.emailAddress
      } catch (error) {
        actual = error.message
      }
      expect(actual).to.equal(testEmail)
    })
    it('POST - set the Location header to "/"', async () => {
      const actual = res.headers.location
      expect(actual).to.equal('/')
    })
    it('POST - return a 201 HTTP status code', async () => {
      const actual = res.status
      expect(actual).to.equal(201)
    })
  // USERS ends here
  })

  describe('COURSES - test the courses routes', () => {
    let res
    let courses
    let actual
    it('GET - the get /courses/ route will return all courses including the user that owns each course', async () => {
      try {
        courses = await Course.findAll({ include: { model: User } })
        res = await axios.get('http://localhost:5000/api/courses')
        actual = res.data.courses
      } catch (error) {
        actual = error.message
      }
      expect(actual[0].title).to.equal(courses[0].dataValues.title)
    })
    it('GET - /courses/ will return a 200 status code', () => {
      expect(res.status).to.equal(200)
    })
    it('GET - /courses/ will return the owner information with the course', () => {
      expect(actual[0].User.emailAddress).to.equal(courses[0].dataValues.User.dataValues.emailAddress)
    })
    
  // COURSES ends here
  })
  // end of meets
  after('delete the test user', async () => {
    const user = await User.findOne({ where: { emailAddress: testEmail } })
    user ? await user.destroy() : false
  })
})