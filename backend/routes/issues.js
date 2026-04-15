import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all issues
router.get('/', authenticateToken, async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        departments: { include: { department: true } },
        createdBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single issue
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        departments: { include: { department: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        logs: { include: { user: { select: { id: true, name: true } } }, orderBy: { timestamp: 'desc' } }
      }
    });
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create issue
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, latitude, longitude, departmentIds } = req.body;
    
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        latitude,
        longitude,
        creatorId: req.user.id,
        departments: {
          create: departmentIds.map(depId => ({
            department: { connect: { id: depId } }
          }))
        },
        logs: {
          create: {
            userId: req.user.id,
            actionDescription: 'Issue created'
          }
        }
      },
      include: {
        departments: { include: { department: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });

    req.io.emit('ISSUE_CREATED', issue);
    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update issue status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const issueId = parseInt(req.params.id);

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status,
        logs: {
          create: {
            userId: req.user.id,
            actionDescription: `Status changed to ${status}`
          }
        }
      },
      include: {
        departments: { include: { department: true } },
        createdBy: { select: { id: true, name: true } },
        logs: { include: { user: { select: { id: true, name: true } } }, orderBy: { timestamp: 'desc' } }
      }
    });

    req.io.emit('ISSUE_UPDATED', updatedIssue);
    res.json(updatedIssue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
