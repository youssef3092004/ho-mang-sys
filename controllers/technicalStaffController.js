const TechnicalStaff = require('../models/technicalStaffModel');
const pagination = require('../utils/pagination');
const client = require('../config/redisConfig');

/**
 * @function getTechnicalStaff
 * @description Get all technical staff members with pagination and caching.
 * @route GET /api/technical-staff
 * @access Public
 */
const getTechnicalStaff = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req);
    const redisKey = `technicalStaff:page:${page}:limit:${limit}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached technical staff data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const staff = await TechnicalStaff.find()
      .populate('hospital', 'name')
      .skip(skip)
      .limit(limit);

    const total = await TechnicalStaff.countDocuments();

    if (!staff || staff.length === 0) {
      res.status(404);
      throw new Error('No technical staff found');
    }

    const result = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: staff,
    };

    await client.setEx(redisKey, 3600, JSON.stringify(result));
    console.log('Returning technical staff from MongoDB and caching in Redis');
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getOneTechnicalStaff
 * @description Get one technical staff member by ID
 * @route GET /api/technical-staff/:id
 * @access Public
 */
const getOneTechnicalStaff = async (req, res, next) => {
  try {
    const redisKey = `technicalStaff:${req.params.id}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached technical staff member');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const staff = await TechnicalStaff.findById(req.params.id).populate('hospital', 'name');
    if (!staff) {
      res.status(404);
      throw new Error('Technical staff member not found');
    }

    await client.setEx(redisKey, 3600, JSON.stringify(staff));
    res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @function updateTechnicalStaff
 * @description Update technical staff by ID
 * @route PUT /api/technical-staff/:id
 * @access Public
 */
const updateTechnicalStaff = async (req, res, next) => {
  try {
    const updatedStaff = await TechnicalStaff.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedStaff) {
      res.status(404);
      throw new Error('Technical staff member not found');
    }

    const redisKey = `technicalStaff:${updatedStaff._id}`;
    await client.setEx(redisKey, 3600, JSON.stringify(updatedStaff));
    console.log('Updated and cached technical staff member');

    res.status(200).json(updatedStaff);
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteTechnicalStaff
 * @description Delete a technical staff member by ID
 * @route DELETE /api/technical-staff/:id
 * @access Public
 */
const deleteTechnicalStaff = async (req, res, next) => {
  try {
    const staff = await TechnicalStaff.findById(req.params.id);
    if (!staff) {
      res.status(404);
      throw new Error('Technical staff member not found');
    }

    await TechnicalStaff.findByIdAndDelete(req.params.id);
    const redisKey = `technicalStaff:${req.params.id}`;
    await client.del(redisKey);

    res.status(200).json({ message: 'Technical staff member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteAllTechnicalStaff
 * @description Delete all technical staff members from the database
 * @route DELETE /api/technical-staff
 * @access Admin
 */
const deleteAllTechnicalStaff = async (req, res, next) => {
  try {
    const result = await TechnicalStaff.deleteMany();

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('No technical staff members to delete');
    }

    const redisKeys = await client.keys('technicalStaff:*');
    for (const key of redisKeys) {
      await client.del(key);
    }

    res.status(200).json({ message: 'All technical staff members deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTechnicalStaff,
  getOneTechnicalStaff,
  updateTechnicalStaff,
  deleteTechnicalStaff,
  deleteAllTechnicalStaff,
};
