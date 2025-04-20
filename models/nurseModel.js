const mongoose = require('mongoose');

const NurseSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add a full name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
  },
  password: {
    type: String,
    required: false,
    maxlength: 100,
  },
  specialization: {
    type: String,
    required: [true, 'Please add a specialization']
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please add a license number'],
    unique: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  emergencyPhone: {
    type: String,
    required: [true, 'Please add an emergency contact']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  status: {
    type: String,
    enum: ['In Hospital', 'Out', 'On Break', 'On Vacation', 'Working from Home'],
    default: 'In Hospital'
  },
  age: {
    type: Number,
    required: [true, 'Please add age']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Nurse', NurseSchema);
