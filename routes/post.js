const express = require('express')
const { Course, User } = require('../models')
const { asyncHandler } = require('../middleware/async-handler')
const { authenticateUser } = require('../middleware/auth-user')

const router = express.Router()

// POST route that will create a new user, set the Location header to "/", and return a 201 HTTP status code and no content.
router.post('/users', asyncHandler(async (req, res) => {
  try {
    await User.create(req.body)
    res.redirect(201, '/')
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message)
      res.status(400).json({ errors })
    } else {
      throw error
    }
  }
}))

// POST /api/courses route that will create a new course, set the Location header to the URI for the newly created course,
// and return a 201 HTTP status code and no content.
router.post('/courses', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const course = await Course.create(req.body)
    res.redirect(201, `/api/courses/${course.id}`)
  } catch (error) {
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => err.message)
      res.status(400).json({ errors })
    } else {
      throw error
    }
  }
}))

module.exports = router
