import express from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All routes here are protected: require ADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// ──────────────────────────────────────────────
// ADMIN COMPLAINT MANAGEMENT
// ──────────────────────────────────────────────

// GET /api/admin/complaints  – List all complaints
router.get('/complaints', async (req, res) => {
  try {
    const { status, flagged } = req.query;

    const where = {};
    if (status) where.status = status;
    if (flagged === 'true') where.is_flagged = true;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        assignments: { include: { department: true } },
        issue: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/complaints/:id  – Single complaint (full admin view)
router.get('/complaints/:id', async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assignments: { include: { department: true } },
        issue: true,
      },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/complaints/:id/status  – Update complaint status
router.put('/complaints/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: { assignments: { include: { department: true } } },
    });
    req.io.emit('COMPLAINT_UPDATED', complaint);
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/complaints/:id/assign  – Assign to department(s)
router.put('/complaints/:id/assign', async (req, res) => {
  try {
    const { departmentIds } = req.body; // array of department IDs
    if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
      return res.status(400).json({ error: 'departmentIds must be a non-empty array' });
    }

    const complaintId = parseInt(req.params.id);

    // Delete old assignments then create new ones
    await prisma.complaintAssignment.deleteMany({ where: { complaintId } });

    const complaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'ASSIGNED',
        assignments: {
          create: departmentIds.map(id => ({ department: { connect: { id } } })),
        },
      },
      include: { assignments: { include: { department: true } } },
    });

    req.io.emit('COMPLAINT_ASSIGNED', complaint);
    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/complaints/:id/flag  – Mark as spam/fake
router.put('/complaints/:id/flag', async (req, res) => {
  try {
    const { is_flagged } = req.body;
    const complaint = await prisma.complaint.update({
      where: { id: parseInt(req.params.id) },
      data: {
        is_flagged: is_flagged !== false, // defaults to true
        status: is_flagged !== false ? 'CLOSED' : undefined,
      },
    });
    req.io.emit('COMPLAINT_FLAGGED', complaint);
    res.json({ message: 'Complaint flagged', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/complaints/:id/convert  – Convert complaint to internal task
router.post('/complaints/:id/convert', async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { assignments: true },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.issueId) return res.status(400).json({ error: 'Already converted to an issue' });
    if (complaint.is_flagged) return res.status(400).json({ error: 'Cannot convert a flagged complaint' });

    const deptIds = complaint.assignments.map(a => a.departmentId);

    const issue = await prisma.issue.create({
      data: {
        title: `Complaint Task: ${complaint.issue_type || 'General'}`,
        description: `Source Complaint Details:\nAction Required for: ${complaint.description}\nLocation: ${complaint.location || 'N/A'}`,
        priority: 'MEDIUM',
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        status: 'OPEN',
        creatorId: req.user.id,
        departments: {
          create: deptIds.map(depId => ({ department: { connect: { id: depId } } })),
        },
        logs: {
          create: {
            userId: req.user.id,
            actionDescription: 'Converted from public complaint.',
          },
        },
      },
    });

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: { issueId: issue.id, status: 'IN_PROGRESS' },
    });

    req.io.emit('ISSUE_CREATED', issue);
    res.json({ complaint: updatedComplaint, issue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ──────────────────────────────────────────────
// ADMIN DASHBOARD STATS
// ──────────────────────────────────────────────

// GET /api/admin/stats  – Dashboard metrics
router.get('/stats', async (req, res) => {
  try {
    const [total, pending, inProgress, resolved, flagged] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: ['RECEIVED', 'ASSIGNED'] } } }),
      prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.complaint.count({ where: { is_flagged: true } }),
    ]);
    res.json({ total, pending, inProgress, resolved, flagged });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/departments  – List departments for assignment UI
router.get('/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
