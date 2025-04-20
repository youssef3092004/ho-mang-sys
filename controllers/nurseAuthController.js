const Nurse = require('../models/nurseModel');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const {
  validatePassword,
  validateEmail,
  validatePhone
} = require('../utils/validations');

/**
 * @function registerNurse
 * @description Registers a new nurse in the system.
 * @route POST /api/nurses/register
 * @access Public
 */
const registerNurse = async (req, res, next) => {
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
      age
    } = req.body;

    const requiredFields = {
      fullName,
      email,
      password,
      specialization,
      licenseNumber,
      phone,
      emergencyPhone,
      address,
      hospital,
      age
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
        error:
          "Password must be at least 6 characters long, include a number, and a special character"
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

    const existingNurse = await Nurse.findOne({ email });
    if (existingNurse) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered, please login!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newNurse = await Nurse.create({
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
      message: 'Nurse registered successfully',
      nurseId: newNurse._id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @function loginNurse
 * @description Logs in an existing nurse.
 * @route POST /api/nurses/login
 * @access Public
 */
const loginNurse = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const nurse = await Nurse.findOne({ email });
    if (!nurse) {
      return res.status(404).json({
        success: false,
        error: 'Nurse not found'
      });
    }

    const isMatch = await bcrypt.compare(password, nurse.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const token = JWT.sign({ id: nurse._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    nurse.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      nurse
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerNurse,
  loginNurse
};
