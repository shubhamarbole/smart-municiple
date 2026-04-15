import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ──────────────────────────────────────────────
// PUBLIC ROUTES – no authentication required
// ──────────────────────────────────────────────

// Keyword dictionary for intelligent auto-routing
const departmentKeywords = {
  Water:       ['leak', 'pipe', 'water', 'drainage', 'sewage', 'burst', 'flood'],
  Roads:       ['pothole', 'digging', 'road', 'street', 'asphalt', 'paving', 'blockage', 'traffic'],
  Electricity: ['wire', 'pole', 'power', 'electricity', 'blackout', 'spark', 'light', 'outage'],
};

// POST /api/complaints  – Submit a public complaint
router.post('/', async (req, res) => {
  try {
    const {
      citizenName,
      description,
      issue_type,
      location,
      latitude,
      longitude,
      media_url,
      created_by,
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Fetch available departments
    const departments = await prisma.department.findMany();

    // Auto-assignment based on keywords in description + issue_type
    const textToAnalyze = `${description} ${issue_type || ''}`.toLowerCase();
    const assignedDeptIds = departments
      .filter(dept => (departmentKeywords[dept.name] || []).some(kw => textToAnalyze.includes(kw)))
      .map(dept => dept.id);

    const complaint = await prisma.complaint.create({
      data: {
        citizenName,
        description,
        issue_type,
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        media_url: media_url || null,
        created_by: created_by ? parseInt(created_by) : null,
        status: assignedDeptIds.length > 0 ? 'ASSIGNED' : 'RECEIVED',
        assignments: {
          create: assignedDeptIds.map(id => ({ department: { connect: { id } } })),
        },
      },
      include: { assignments: { include: { department: true } } },
    });

    req.io.emit('COMPLAINT_RECEIVED', complaint);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaintId: complaint.id,
      trackingId: `CMP-${complaint.id}`,
      autoAssigned: complaint.assignments.map(a => a.department.name),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/complaints/:id  – Public complaint tracking by ID
router.get('/:id', async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { assignments: { include: { department: true } } },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Return a safe public view (no internal admin info)
    res.json({
      trackingId: `CMP-${complaint.id}`,
      issue_type: complaint.issue_type,
      description: complaint.description,
      location: complaint.location,
      status: complaint.status,
      createdAt: complaint.createdAt,
      assignedDepartments: complaint.assignments.map(a => a.department.name),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
