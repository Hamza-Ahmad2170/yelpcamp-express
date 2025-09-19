import mongoose from 'mongoose';

import { app } from '@/app.js';
import { env } from '@/lib/env.js';

(async () => {
  try {
    await mongoose.connect(env.DATABASE_URL);
    app.on('error', (error) => {
      console.log('ERRR: ', error);
      throw error;
    });

    app.listen(env.PORT || 8000, () => {
      console.log(`App is listening on port ${env.PORT || 8000}`);
    });
  } catch (error) {
    console.error('ERROR: ', error);
    throw error;
  }
})();
