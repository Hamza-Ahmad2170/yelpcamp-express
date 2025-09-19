import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
  body: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

export default model('Review', reviewSchema);
