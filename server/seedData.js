const mongoose = require('mongoose');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Inventory = require('./models/Inventory');
const Emergency = require('./models/Emergency');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Inventory.deleteMany({});
    await Emergency.deleteMany({});

    // Seed Patients
    const patients = [
      {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1985-06-15'),
          gender: 'Male',
          phone: '555-0101',
          email: 'john.doe@email.com',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        },
        medicalInfo: {
          bloodGroup: 'O+',
          allergies: ['Penicillin'],
          chronicConditions: ['Hypertension'],
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '555-0102'
          }
        },
        healthScore: {
          current: 75,
          riskFactors: ['High Blood Pressure', 'Family History']
        }
      },
      {
        personalInfo: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          dateOfBirth: new Date('1992-03-22'),
          gender: 'Female',
          phone: '555-0201',
          email: 'sarah.johnson@email.com',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          }
        },
        medicalInfo: {
          bloodGroup: 'A+',
          allergies: [],
          chronicConditions: [],
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Brother',
            phone: '555-0202'
          }
        },
        healthScore: {
          current: 92,
          riskFactors: []
        }
      }
    ];

    await Patient.insertMany(patients);
    console.log('Patients seeded successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();