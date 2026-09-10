/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      role: string;
      ownedClassIds: string[];
    };
  }
}
