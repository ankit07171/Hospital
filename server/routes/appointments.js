const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');

// 🔢 Safe number parsing
const safeParseInt = (value, defaultValue) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// 📌 GET ALL APPOINTMENTS (pagination + search)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, date } = req.query;

    const pageNum = safeParseInt(page, 1);
    const limitNum = safeParseInt(limit, 10);

    const query = {};

    if (status) query.status = status;
    if (date) query.date = date;

    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }

    const appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 }) // frontend also sorts, this is backup
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
    });
  } catch (error) {
    console.error('GET appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});


// 📌 GET SINGLE APPOINTMENT
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});


// 📌 CREATE APPOINTMENT
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      doctorName,
      department,
      date,
      time,
      duration,
      type,
      status,
      notes
    } = req.body;

    if (!patientName || !doctorName || !department || !date) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const appointment = new Appointment({
      appointmentId: `APT${Date.now()}`,
      patientName,
      doctorName,
      department,
      date,
      time: time || '10:00',
      duration: duration || 30,
      type: type || 'OPD',
      status: status || 'Scheduled',
      notes
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error('CREATE appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});


// 📌 UPDATE APPOINTMENT
router.put('/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('UPDATE appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});


// 📌 CANCEL APPOINTMENT (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const cancelled = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    );

    if (!cancelled) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: cancelled
    });
  } catch (error) {
    console.error('DELETE appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
  