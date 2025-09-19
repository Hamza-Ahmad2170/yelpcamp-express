import ApiError from '@/lib/ApiError.js';
import ApiResponse from '@/lib/ApiResponse.js';
import Campground from '@/models/campground.model.js';
import type { Request, Response } from 'express';

const getAllCampgrounds = async (_req: Request, res: Response) => {
  const campgrounds = await Campground.find();

  res.status(200).json(new ApiResponse(200, campgrounds));
};

const createCampground = async (_req: Request, _res: Response) => {};

const getCampgroundById = async (req: Request, res: Response) => {
  const campground = await Campground.findById(req.params['id']);

  if (!campground) {
    throw new ApiError(404, 'Campground not found');
  }

  res.status(200).json(new ApiResponse(200, campground));
};

const updateCampground = async (_req: Request, _res: Response) => {};

const deleteCampground = async (req: Request, res: Response) => {
  const id = req.params['id'];
  const campground = await Campground.findByIdAndDelete(id);

  if (!campground) {
    throw new ApiError(404, 'Campground not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, campground, `Campground with ${id} was deleted successfully`));
};

export {
  getAllCampgrounds,
  createCampground,
  getCampgroundById,
  updateCampground,
  deleteCampground,
};
