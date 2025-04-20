const Doctor = require('../models/doctorModel');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');  

const { validatePassword, validateEmail, validatePhone } = require('../utils/validations');

/**
 * @function registerDoctor
 * @description Registers a new doctor in the system.
 * @route POST /api/doctors/register
 * @access Public
 */
const registerDoctor = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      specialization,
      licenseNumber,
      phone,
      emergencyPhone,
      address,
      hospital,
      age,
    } = req.body;

    const requiredFields = {
      fullName, email, password, specialization, licenseNumber, phone, emergencyPhone, address, hospital, age,
    };

    for (let field in requiredFields) {
      if (!requiredFields[field]) {
        return res.status(400).json({
          success: false,
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        });
      }
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long, include a number, and a special character"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be between 10 to 15 digits"
      });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered, please login!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = await Doctor.create({
      fullName,
      email,
      password: hashedPassword,
      specialization,
      licenseNumber,
      phone,
      emergencyPhone,
      address,
      hospital,
      age
    });

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully',
      doctorId: newDoctor._id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @function loginDoctor
 * @description Logs in an existing doctor.
 * @route POST /api/doctors/login
 * @access Public
 */
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const token = JWT.sign({ id: doctor._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    doctor.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      doctor
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerDoctor,
  loginDoctor
};
