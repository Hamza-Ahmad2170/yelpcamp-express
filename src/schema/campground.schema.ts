import z from 'zod';

const campgroundSchema = z.object({
  title: z.string().min(5).max(100),
  image: z.string().min(1).max(1000),
  description: z.string().min(10).max(1000),
  price: z.number().min(0),
  location: z.string().min(1).max(1000),
});

export { campgroundSchema };
