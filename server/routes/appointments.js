const express = require('express');
const router = express.Router();

// Mock appointment data - replace with actual Appointment model
let appointments = [
  {
    id: 1,
    appointmentId: 'APT000001',
    patientId: 'PAT000001',
    doctorId: 'DOC000001',
    patientName: 'John Doe',
    doctorName: 'Dr. Smith',
    department: 'Cardiology',
    date: new Date('2024-02-03T10:00:00'),
    duration: 30,
    type: 'OPD',
    status: 'Scheduled',
    notes: 'Regular checkup'
  },
  {
    id: 2,
    appointmentId: 'APT000002',
    patientId: 'PAT000002',
    doctorId: 'DOC000002',
    patientName: 'Jane Smith',
    doctorName: 'Dr. Johnson',
    department: 'Neurology',
    date: new Date('2024-02-03T14:30:00'),
    duration: 45,
    type: 'OPD',
    status: 'Confirmed',
    notes: 'Follow-up consultation'
  }
];

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, date, status, department } = req.query;
    let filteredAppointments = [...appointments];

    // Filter by date
    if (date) {
      const filterDate = new Date(date);
      filteredAppointments = filteredAppointments.filter(apt => 
        apt.date.toDateString() === filterDate.toDateString()
      );
    }

    // Filter by status
    if (status) {
      filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
    }

    // Filter by department
    if (department) {
      filteredAppointments = filteredAppointments.filter(apt => apt.department === department);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    res.json({
      appointments: paginatedAppointments,
      totalPages: Math.ceil(filteredAppointments.length / limit),
      currentPage: parseInt(page),
      total: filteredAppointments.length
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = appointments.find(apt => apt.id === parseInt(req.params.id));
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const newAppointment = {
      id: appointments.length + 1,
      appointmentId: `APT${String(appointments.length + 1).padStart(6, '0')}`,
      ...req.body,
      date: new Date(req.body.date),
      status: 'Scheduled'
    };

    appointments.push(newAppointment);

    // Emit real-time update
    req.app.get('io').emit('appointment-created', newAppointment);

    res.status(201).json(newAppointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const appointmentIndex = appointments.findIndex(apt => apt.id === parseInt(req.params.id));
    if (appointmentIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointments[appointmentIndex] = {
      ...appointments[appointmentIndex],
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : appointments[appointmentIndex].date
    };

    // Emit real-time update
    req.app.get('io').emit('appointment-updated', appointments[appointmentIndex]);

    res.json(appointments[appointmentIndex]);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Cancel appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointmentIndex = appointments.findIndex(apt => apt.id === parseInt(req.params.id));
    if (appointmentIndex === -1) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointments[appointmentIndex].status = 'Cancelled';

    // Emit real-time update
    req.app.get('io').emit('appointment-cancelled', appointments[appointmentIndex]);

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get today's appointments
router.get('/today/list', async (req, res) => {
  try {
    const today = new Date();
    const todayAppointments = appointments.filter(apt => 
      apt.date.toDateString() === today.toDateString()
    );

    res.json(todayAppointments);
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
  }
});

module.exports = router;