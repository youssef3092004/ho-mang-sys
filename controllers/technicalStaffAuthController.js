const TechnicalStaff = require('../models/technicalStaffModel');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

const { validatePassword, validateEmail, validatePhone } = require('../utils/validations');

/**
 * @function registerTechnicalStaff
 * @description Registers a new technical staff member.
 * @route POST /api/technical/register
 * @access Public
 */
const registerTechnicalStaff = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      department,
      phone,
      emergencyPhone,
      address,
      hospital,
      age
    } = req.body;

    const requiredFields = {
      fullName, email, password, role, department, phone, emergencyPhone, address, hospital, age
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

    const existingStaff = await TechnicalStaff.findOne({ email });
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered, please login!'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await TechnicalStaff.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      department,
      phone,
      emergencyPhone,
      address,
      hospital,
      age
    });

    res.status(201).json({
      success: true,
      message: 'Technical staff registered successfully',
      staffId: newStaff._id
    });

  } catch (err) {
    next(err);
  }
};

/**
 * @function loginTechnicalStaff
 * @description Logs in an existing technical staff member.
 * @route POST /api/technical/login
 * @access Public
 */
const loginTechnicalStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    const staff = await TechnicalStaff.findOne({ email });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    const token = JWT.sign({ id: staff._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    staff.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      staff
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerTechnicalStaff,
  loginTechnicalStaff
};
