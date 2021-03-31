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
    it('GET - /courses/ will NOT return the excluded attributes', () => {
      expect(actual[0].User.password).to.be.undefined
    })
    it('GET - the get /courses/:id route will return corresponding course including the user that owns that course', async () => {
      try {
        courses = await Course.findOne({
          where: { id: 2 },
          include: { model: User }
        })
        res = await axios.get('http://localhost:5000/api/courses/2')
        actual = res.data.course.title
      } catch (error) {
        actual = error.message
      }
      expect(actual).to.equal(courses.dataValues.title)
    })
    it('GET - /courses/:id will return a 200 status code', () => {
      expect(res.status).to.equal(200)
    })
    it('GET - /courses/:id will return the owner information with the course', () => {
      expect(res.data.course.User.emailAddress).to.equal(courses.dataValues.User.dataValues.emailAddress)
    })
    it('GET - /courses/:id will NOT return the excluded attributes', () => {
      expect(res.data.course.User.password).to.be.undefined
    })
    // GET COURSES stops here

    // POST COURSES starts here
    it('POST - the post route will create a new course', async () => {
      let actual
      let data
      try {
        data = {
          title: 'first test course',
          description: 'this is a test course',
          estimatedTime: 'just a little while',
          materialsNeeded: 'bring yourself and a laptop',
          userId: 1
        }
        const axiosConfig = createToken(joeEmail, joePW, 'http://localhost:5000/api/courses', 'post', data)
        res = await axios(axiosConfig)
        actual = await Course.findOne({ where: { title: data.title } })
        actual = actual.title
      } catch (error) {
        actual = error.message
      }
      expect(actual).to.equal(data.title)
    })
    it('GET - /courses/:id will return a 201 status code', () => {
      expect(res.status).to.equal(201)
    })
    it('POST - set the Location header to "/api/courses/newid"', async () => {
      const actual = await Course.findOne({ where: { title: 'first test course' } })
      expect(res.headers.location).to.equal(`/api/courses/${actual.id}`)
    })
    // PUT COURSES starts here
    it('PUT - this will return "access denied" if user is not authorized to update', async () => {
      let actual
      let data
      try {
        data = await Course.findOne({ where: { title: 'first test course' } })
        data = data.dataValues
        data.description = 'the updated description'
        const axiosConfig = createToken(testEmail, testPW, `http://localhost:5000/api/courses/${data.id}`, 'put', data)
        res = await axios(axiosConfig)
        actual = await Course.findOne({ where: { title: data.title } })
        actual = actual.description
      } catch (error) {
        actual = error.response.data.message
        res = error.response
      }
      expect(actual).to.equal('Access Denied')
    })
    it('PUT - /courses/:id without user authentication will return a 403 status code', () => {
      expect(res.status).to.equal(403)
    })
    it('PUT - the put route will update a course', async () => {
      let actual
      let data
      try {
        data = await Course.findOne({ where: { title: 'first test course' } })
        data = data.dataValues
        data.description = 'the updated description'
        const axiosConfig = createToken(joeEmail, joePW, `http://localhost:5000/api/courses/${data.id}`, 'put', data)
        res = await axios(axiosConfig)
        actual = await Course.findOne({ where: { title: data.title } })
        actual = actual.description
      } catch (error) {
        actual = error.message
      }
      expect(actual).to.equal(data.description)
    })
    it('GET - /courses/:id will return a 204 status code', () => {
      expect(res.status).to.equal(204)
    })
    // DELETE ROUTE starts here
    it('DELETE - this will return "access denied" if user is not authorized to delete', async () => {
      let actual
      let data
      try {
        data = await Course.findOne({ where: { title: 'first test course' } })
        const axiosConfig = createToken(testEmail, testPW, `http://localhost:5000/api/courses/${data.id}`, 'delete')
        res = await axios(axiosConfig)
        actual = await Course.findOne({ where: { title: data.title } })
      } catch (error) {
        actual = error.response.data.message
        res = error.response
      }
      expect(actual).to.equal('Access Denied')
    })
    it('DELETE - /courses/:id without user authentication will return a 403 status code', () => {
      expect(res.status).to.equal(403)
    })
    it('DELETE - this will delete a course', async () => {
      let actual
      let data
      try {
        data = await Course.findOne({ where: { title: 'first test course' } })
        const axiosConfig = createToken(joeEmail, joePW, `http://localhost:5000/api/courses/${data.id}`, 'delete')
        res = await axios(axiosConfig)
        actual = await Course.findOne({ where: { title: data.title } })
      } catch (error) {
        actual = error.message
      }
      expect(actual).to.be.null
    })
    it('GET - /courses/:id will return a 204 status code', () => {
      expect(res.status).to.equal(204)
    })
  // COURSES ends here
  })
  // end of meets
  after('delete the test user', async () => {
    const user = await User.findOne({ where: { emailAddress: testEmail } })
    user ? await user.destroy() : false
  })
  after('delete the test course', async () => {
    const course = await Course.findOne({ where: { title: 'first test course' } })
    course ? await course.destroy() : false
  })
})
