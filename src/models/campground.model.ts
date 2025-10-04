import { Schema, model } from 'mongoose';

const campgroundSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
      minlength: 5,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      minlength: 10,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    // geometry: {
    //   type: {
    //     type: String,
    //     enum: ['Point'],
    //     required: true,
    //   },
    //   coordinates: {
    //     type: [Number],
    //     required: true,
    //   },
    // },
    // author: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    // reviews: [
    //   {
    //     type: Schema.Types.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  {
    timestamps: true,
  },
);

export default model('campground', campgroundSchema);
