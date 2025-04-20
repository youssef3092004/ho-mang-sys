const Hospital = require('../models/hospitalModel');
const pagination = require('../utils/pagination');
const client = require('../config/redisConfig');

/**
 * @function getHospitals
 * @description Retrieves all hospitals with pagination and Redis caching.
 * @route GET /api/hospitals
 * @access Public
 */
const getHospitals = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req);
    const redisKey = `hospitals:page:${page}:limit:${limit}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached hospitals data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const hospitals = await Hospital.find().skip(skip).limit(limit);
    const total = await Hospital.countDocuments();

    if (!hospitals || hospitals.length === 0) {
      res.status(404);
      throw new Error('No hospitals found');
    }

    const result = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: hospitals,
    };

    await client.setEx(redisKey, 3600, JSON.stringify(result));
    console.log('Returning hospital data from MongoDB and caching in Redis');
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getHospital
 * @description Retrieves a hospital by ID.
 * @route GET /api/hospitals/:id
 * @access Public
 */
const getHospital = async (req, res, next) => {
  try {
    const redisKey = `hospital:${req.params.id}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached hospital data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      throw new Error('Hospital not found');
    }

    await client.setEx(redisKey, 3600, JSON.stringify(hospital));
    console.log('Returning hospital from MongoDB and caching in Redis');
    return res.status(200).json(hospital);
  } catch (error) {
    next(error);
  }
};

/**
 * @function updateHospital
 * @description Updates a hospital by ID.
 * @route PUT /api/hospitals/:id
 * @access Public
 */
const updateHospital = async (req, res, next) => {
  try {
    const updatedHospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedHospital) {
      res.status(404);
      throw new Error('Hospital not found');
    }

    const redisKey = `hospital:${updatedHospital._id}`;
    await client.setEx(redisKey, 3600, JSON.stringify(updatedHospital));
    console.log('Caching updated hospital in Redis');
    res.status(200).json(updatedHospital);
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteHospital
 * @description Deletes a hospital by ID.
 * @route DELETE /api/hospitals/:id
 * @access Public
 */
const deleteHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      res.status(404);
      throw new Error('Hospital not found');
    }

    await Hospital.findByIdAndDelete(req.params.id);
    const redisKey = `hospital:${req.params.id}`;
    await client.del(redisKey);
    console.log('Deleted hospital from Redis');

    res.status(200).json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteAllHospitals
 * @description Deletes all hospitals from the database.
 * @route DELETE /api/hospitals
 * @access Admin
 */
const deleteAllHospitals = async (req, res, next) => {
  try {
    const result = await Hospital.deleteMany();

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('No hospitals to delete');
    }

    const redisKeys = await client.keys('hospital:*');
    for (const key of redisKeys) {
      await client.del(key);
    }

    res.status(200).json({ message: 'All hospitals deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHospitals,
  getHospital,
  updateHospital,
  deleteHospital,
  deleteAllHospitals,
};
