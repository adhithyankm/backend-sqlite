import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

router.post('/register', (req, res) => {
  const {username, password} = req.body

  try {
    const hashedPassword = bcrypt.hashSync(password, 8)

    const insertUser = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`)
    const result = insertUser.run(username, hashedPassword)

    // adding a first todo for the user
    const defaultTodo = `Hello :)  Add your first todo`
    const insertTodo = db.prepare(`INSERT INTO todos (user_id, task) VALUES (?, ?)`)
    insertTodo.run(result.lastInsertRowid, defaultTodo)

    const token = jwt.sign({id: result.lastInsertRowid}, process.env.JWT_SCERET, { expiresIn: '24h'})
    return res.status(201).json({token})
  } catch (err) {
    console.error(err.message)
    return res.status(503).json({message: 'Registration failed'})
  }
})

router.post('/login', (req, res) => {
  const {username, password} = req.body

  try {
    const getUser = db.prepare('SELECT * FROM users WHERE username = ?')
    const user = getUser.get(username)

    if(!user) return res.status(404).json({message: "User not found"})
    const isPasswordValid = bcrypt.compareSync(password, user.password)
    if(!isPasswordValid) return res.status(401).json({message: "Invalid password"})
    console.log(user)
    
    const token = jwt.sign({id: user.id}, process.env.JWT_SCERET, {expiresIn: '24h'})
    return res.json({token})
  } catch(err) {
    console.error(err.message)
    return res.status(500).json({message: 'Login failed'})
  }
})


export default router