const express = require('express')
const { Course, User } = require('../models')
const { asyncHandler } = require('../middleware/async-handler')
const { authenticateUser } = require('../middleware/auth-user')
const excludedAttributes = ['password', 'createdAt', 'updatedAt']

const router = express.Router()

// GET route that will return the currently authenticated user along with a 200 HTTP status code.
router.get('/users', authenticateUser, asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      emailAddress: req.currentUser.emailAddress
    },
    attributes: { exclude: excludedAttributes }
  })
  res.status(200).json({ user })
}))

// GET route that will return a list of all courses including the User that owns each course and a 200 HTTP status code.
router.get('/courses', asyncHandler(async (req, res) => {
  const courses = await Course.findAll({
    include: {
      model: User,
      attributes: { exclude: excludedAttributes }
    },
    attributes: { exclude: excludedAttributes }
  })
  res.status(200).json({ courses })
}))

// A /api/courses/:id GET route that will return the corresponding course along with the User that owns that course and a 200 HTTP status code.
router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    where: { id: req.params.id },
    include: {
      model: User,
      attributes: { exclude: excludedAttributes }
    },
    attributes: { exclude: excludedAttributes }
  })
  res.status(200).json({ course })
}))

module.exports = router
