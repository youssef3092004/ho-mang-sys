const Hospital = require('../models/hospitalModel');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

const { validateEmail, validatePassword, validatePhone } = require('../utils/validations');

/**
 * @function registerHospital
 * @description Registers a new hospital in the system.
 * @route POST /api/hospitals/register
 * @access Public
 */
const registerHospital = async (req, res, next) => {
  try {
    const { name, email, password, address, phone, website, description } = req.body;

    const requiredFields = { name, email, password, address, phone };

    for (let field in requiredFields) {
      if (!requiredFields[field]) {
        return res.status(400).json({
          success: false,
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        });
      }
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long, include a number, and a special character"
      });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone number must be between 10 to 15 digits"
      });
    }

    const existingHospital = await Hospital.findOne({ email });
    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered, please login!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newHospital = await Hospital.create({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      website,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully',
      hospitalId: newHospital._id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @function loginHospital
 * @description Logs in an existing hospital.
 * @route POST /api/hospitals/login
 * @access Public
 */
const loginHospital = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const hospital = await Hospital.findOne({ email });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Hospital not found'
      });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const token = JWT.sign({ id: hospital._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    hospital.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      hospital
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerHospital,
  loginHospital
};
