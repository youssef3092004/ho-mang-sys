const Doctor = require('../models/doctorModel');
const pagination = require('../utils/pagination');
const client = require('../config/redisConfig');

/**
 * @function getDoctors
 * @description Retrieves all doctors from the database with pagination.
 * @route GET /api/doctors
 * @access Public
 * @returns {JSON} JSON array containing all doctors in the database with pagination details.
 * @throws {Error} If no doctors are found in the database.
 *
 * This function fetches all doctors from the database and returns them with pagination details.
 * It also checks the Redis cache before querying the database for optimization.
 */
const getDoctors = async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req);
    const redisKey = `doctors:page:${page}:limit:${limit}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const doctors = await Doctor.find().skip(skip).limit(limit);
    const total = await Doctor.countDocuments();

    if (!doctors || doctors.length === 0) {
      res.status(404);
      throw new Error('No doctors found');
    }

    const result = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: doctors,
    };

    await client.setEx(redisKey, 3600, JSON.stringify(result));
    console.log('Returning data from MongoDB and caching it in Redis');
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @function getDoctor
 * @description Fetches a specific doctor by their ID.
 * @route GET /api/doctors/:id
 * @access Public
 * @param {string} id - The ID of the doctor to fetch.
 * @returns {JSON} JSON object containing the doctor's data.
 * @throws {Error} If no doctor is found by the provided ID.
 *
 * This function retrieves a doctor from the database by their ID.
 * If the doctor is found, the doctor's data is returned in the response.
 * If no doctor is found, an error message is thrown.
 */
const getDoctor = async (req, res, next) => {
  try {
    const redisKey = `doctor:${req.params.id}`;
    const cachedData = await client.get(redisKey);

    if (cachedData) {
      console.log('Using cached data');
      return res.status(200).json(JSON.parse(cachedData));
    }

    const doctor = await Doctor.findById(req.params.id).populate('hospital');
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    await client.setEx(redisKey, 3600, JSON.stringify(doctor));
    console.log('Returning data from MongoDB and caching it in Redis');
    return res.status(200).json(doctor);
  } catch (error) {
    next(error);
  }
};

/**
 * @function updateDoctor
 * @description Updates an existing doctor in the database.
 * @route PUT /api/doctors/:id
 * @access Public
 * @param {string} id - The ID of the doctor to update.
 * @param {Object} req.body - The fields to update.
 * @returns {JSON} JSON object containing the updated doctor data.
 * @throws {Error} If no doctor is found by the provided ID or if the update fails.
 *
 * This function updates the doctor's information in the database.
 * If the doctor is not found or if the update fails, an error is returned.
 */
const updateDoctor = async (req, res, next) => {
  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedDoctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    const redisKey = `doctor:${updatedDoctor._id}`;
    await client.setEx(redisKey, 3600, JSON.stringify(updatedDoctor));
    console.log('Caching updated doctor in Redis');
    res.status(200).json(updatedDoctor);
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteDoctor
 * @description Deletes a doctor by their ID.
 * @route DELETE /api/doctors/:id
 * @access Public
 * @param {string} id - The ID of the doctor to delete.
 * @returns {JSON} Success message upon successful deletion.
 * @throws {Error} If no doctor is found or the deletion fails.
 *
 * This function deletes a doctor from the database. It also removes the cached data from Redis.
 * If the doctor is not found, an error is thrown.
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error('Doctor not found');
    }

    await Doctor.findByIdAndDelete(req.params.id);
    const redisKey = `doctor:${req.params.id}`;
    await client.del(redisKey);
    console.log('Deleted doctor from Redis');
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @function deleteAllDoctors
 * @description Deletes all doctors from the database.
 * @route DELETE /api/doctors
 * @access Admin
 * @returns {JSON} Success message upon successful deletion of all doctors.
 * @throws {Error} If no doctors are found to delete.
 *
 * This function deletes all doctors from the database and clears the corresponding Redis cache.
 * It should be used with caution as it deletes all data.
 */
const deleteAllDoctors = async (req, res, next) => {
  try {
    const result = await Doctor.deleteMany();

    if (result.deletedCount === 0) {
      res.status(404);
      throw new Error('No doctors to delete');
    }

    const redisKeys = await client.keys('doctor:*');
    for (const key of redisKeys) {
      await client.del(key);
    }

    res.status(200).json({ message: 'All doctors deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
  deleteAllDoctors,
};
