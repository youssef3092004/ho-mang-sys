const Nurse = require('../models/nurseModel');
const pagination = require('../utils/pagination');
const client = require('../config/redisConfig');

/**
 * @function getNurses
 * @description Retrieves all nurses from the database with pagination.
 * @route GET /api/nurses
 * @access Public
 */
const getNurses = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req);
    const redisKey = `nurses:page:${page}:limit:${limit}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached nurses data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const nurses = await Nurse.find().skip(skip).limit(limit);
    const total = await Nurse.countDocuments();

    if (!nurses || nurses.length === 0) {
      res.status(404);
      throw new Error('No nurses found');
    }

    const result = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: nurses,
    };

    await client.setEx(redisKey, 3600, JSON.stringify(result));
    console.log('Returning data from MongoDB and caching nurses in Redis');
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getNurse
 * @description Retrieves a nurse by ID.
 * @route GET /api/nurses/:id
 * @access Public
 */
const getNurse = async (req, res, next) => {
  try {
    const redisKey = `nurse:${req.params.id}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached nurse data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const nurse = await Nurse.findById(req.params.id).populate('hospital');
    if (!nurse) {
      res.status(404);
      throw new Error('Nurse not found');
    }

    await client.setEx(redisKey, 3600, JSON.stringify(nurse));
    console.log('Returning nurse from MongoDB and caching in Redis');
    return res.status(200).json(nurse);
  } catch (error) {
    next(error);
  }
};

/**
 * @function updateNurse
 * @description Updates a nurse by ID.
 * @route PUT /api/nurses/:id
 * @access Public
 */
const updateNurse = async (req, res, next) => {
  try {
    const updatedNurse = await Nurse.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedNurse) {
      res.status(404);
      throw new Error('Nurse not found');
    }

    const redisKey = `nurse:${updatedNurse._id}`;
    await client.setEx(redisKey, 3600, JSON.stringify(updatedNurse));
    console.log('Caching updated nurse in Redis');
    res.status(200).json(updatedNurse);
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteNurse
 * @description Deletes a nurse by ID.
 * @route DELETE /api/nurses/:id
 * @access Public
 */
const deleteNurse = async (req, res, next) => {
  try {
    const nurse = await Nurse.findById(req.params.id);
    if (!nurse) {
      res.status(404);
      throw new Error('Nurse not found');
    }

    await Nurse.findByIdAndDelete(req.params.id);
    const redisKey = `nurse:${req.params.id}`;
    await client.del(redisKey);
    console.log('Deleted nurse from Redis');

    res.status(200).json({ message: 'Nurse deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteAllNurses
 * @description Deletes all nurses from the database.
 * @route DELETE /api/nurses
 * @access Admin
 */
const deleteAllNurses = async (req, res, next) => {
  try {
    const result = await Nurse.deleteMany();

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('No nurses to delete');
    }

    const redisKeys = await client.keys('nurse:*');
    for (const key of redisKeys) {
      await client.del(key);
    }

    res.status(200).json({ message: 'All nurses deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNurses,
  getNurse,
  updateNurse,
  deleteNurse,
  deleteAllNurses,
};
