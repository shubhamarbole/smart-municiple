import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

const router = express.Router();

router.get('/seed', async (req, res) => {
  try {
    const adminPass = await bcrypt.hash('admin123', 10);
    const userPass = await bcrypt.hash('user123', 10);

    const water = await prisma.department.upsert({ where: { name: 'Water' }, update: {}, create: { name: 'Water' } });
    const roads = await prisma.department.upsert({ where: { name: 'Roads' }, update: {}, create: { name: 'Roads' } });
    const electricity = await prisma.department.upsert({ where: { name: 'Electricity' }, update: {}, create: { name: 'Electricity' } });

    await prisma.user.upsert({ where: { email: 'admin@portal.com' }, update: { passwordHash: adminPass }, create: { name: 'Super Admin', email: 'admin@portal.com', passwordHash: adminPass, role: 'ADMIN' } });
    await prisma.user.upsert({ where: { email: 'water@portal.com' }, update: { passwordHash: userPass }, create: { name: 'Water Dept', email: 'water@portal.com', passwordHash: userPass, role: 'DEPT_OFFICER', departmentId: water.id } });
    await prisma.user.upsert({ where: { email: 'roads@portal.com' }, update: { passwordHash: userPass }, create: { name: 'Roads Dept', email: 'roads@portal.com', passwordHash: userPass, role: 'DEPT_OFFICER', departmentId: roads.id } });
    await prisma.user.upsert({ where: { email: 'electricity@portal.com' }, update: { passwordHash: userPass }, create: { name: 'Electricity Dept', email: 'electricity@portal.com', passwordHash: userPass, role: 'DEPT_OFFICER', departmentId: electricity.id } });

    res.json({ message: 'Full Seed successful! Admin, Water, Roads, and Electricity users created.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role || 'FIELD_WORKER',
        departmentId: departmentId || null
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email }, include: { department: true } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, departmentId: user.departmentId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
