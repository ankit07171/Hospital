const express = require('express');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', status = 'Active' } = req.query;
    const query = { status };

    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { doctorId: { $regex: search, $options: 'i' } },
        { 'professionalInfo.specialization': { $regex: search, $options: 'i' } }
      ];
    }

    if (department) {
      query['professionalInfo.department'] = department;
    }

    const doctors = await Doctor.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// Create new doctor
// router.post('/', async (req, res) => {
//   try {
//     const doctor = new Doctor(req.body);
//     if (!req.body.doctorId) {
//   req.body.doctorId = `DOC-${Date.now()}`;
// }

//     await doctor.save();

//     // Emit real-time update
//     req.app.get('io').emit('doctor-created', doctor);

//     res.status(201).json(doctor);
//   } catch (error) {
//     console.error('Create doctor error:', error);
//     if (error.name === 'ValidationError') {
//   return res.status(400).json({
//     message: 'Validation failed',
//     errors: error.errors
//   });
// }

//     // res.status(500).json({ error: 'Failed to create doctor' });
//   }
// });
router.post('/', async (req, res) => {
  try {
    // Fix 3: doctorId
    if (!req.body.doctorId) {
      req.body.doctorId = `DOC-${Date.now()}`;
    }
const doctorCount = await Doctor.countDocuments();
req.body.doctorId = `DOC${String(doctorCount + 1).padStart(6, '0')}`;

    // Fix 4: workSchedule → schedule
    if (req.body.workSchedule) {
      req.body.schedule = {
        workingDays: req.body.workSchedule.workingDays || [],
        workingHours: {
          start: req.body.workSchedule.startTime,
          end: req.body.workSchedule.endTime,
        }
      };
      delete req.body.workSchedule;
    }

    const doctor = new Doctor(req.body);
    await doctor.save();

    res.status(201).json(doctor);
  } catch (error) {
    console.error('Create doctor error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    res.status(500).json({ message: 'Server error' });
  }
});


// Update doctor
router.put('/:id', async (req, res) => {
  try {
    // Fix workSchedule → schedule mapping for updates too
    if (req.body.workSchedule) {
      req.body.schedule = {
        workingDays: req.body.workSchedule.workingDays || [],
        workingHours: {
          start: req.body.workSchedule.startTime,
          end: req.body.workSchedule.endTime,
        }
      };
      delete req.body.workSchedule;
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('doctor-updated', doctor);
    }

    res.json(doctor);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('doctor-deleted', { doctorId: doctor._id });
    }

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

// Add consultation
router.post('/:id/consultations', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const consultation = {
      ...req.body,
      date: new Date()
    };

    doctor.consultations.push(consultation);
    doctor.performance.totalConsultations += 1;
    await doctor.save();

    // Emit real-time update
    req.app.get('io').emit('consultation-added', { doctorId: doctor._id, consultation });

    res.status(201).json(consultation);
  } catch (error) {
    console.error('Add consultation error:', error);
    res.status(500).json({ error: 'Failed to add consultation' });
  }
});

// Get doctor availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const targetDate = new Date(date);
    const availability = doctor.availability.find(
      avail => avail.date.toDateString() === targetDate.toDateString()
    );

    if (!availability) {
      // Generate default slots based on working hours
      const slots = generateTimeSlots(doctor.schedule.workingHours);
      return res.json({ date: targetDate, slots });
    }

    res.json(availability);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Update availability
router.put('/:id/availability', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { date, slots } = req.body;
    const targetDate = new Date(date);

    const existingIndex = doctor.availability.findIndex(
      avail => avail.date.toDateString() === targetDate.toDateString()
    );

    if (existingIndex >= 0) {
      doctor.availability[existingIndex].slots = slots;
    } else {
      doctor.availability.push({ date: targetDate, slots });
    }

    await doctor.save();

    // Emit real-time update
    req.app.get('io').emit('doctor-availability-updated', {
      doctorId: doctor._id,
      date: targetDate,
      slots
    });

    res.json({ date: targetDate, slots });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Helper function to generate time slots
function generateTimeSlots(workingHours) {
  const slots = [];
  const startTime = workingHours.start || '09:00';
  const endTime = workingHours.end || '17:00';
  
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  
  const current = new Date(start);
  while (current < end) {
    slots.push({
      time: current.toTimeString().slice(0, 5),
      isBooked: false,
      patientId: null
    });
    current.setMinutes(current.getMinutes() + 30); // 30-minute slots
  }
  
  return slots;
}

module.exports = router;