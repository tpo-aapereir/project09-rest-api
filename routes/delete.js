const express = require('express')
const { Course, User } = require('../models')
const { asyncHandler } = require('../middleware/async-handler')
const { authenticateUser } = require('../middleware/auth-user')

const router = express.Router()

// DELETE /api/courses/:id DELETE route that will delete the corresponding course and return a 204 HTTP status code and no content.
router.delete('/courses/:id', authenticateUser, asyncHandler(async (req, res) => {
  const course = await Course.findOne({
    where: { id: req.params.id },
    include: { model: User }
  })
  if (req.currentUser.emailAddress === course.User.emailAddress) {
    await course.destroy()
    res.status(204).end()
  } else {
    res.status(403).json({ message: 'Access Denied' })
  }
}))

module.exports = router
