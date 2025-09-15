import _mongoose from 'mongoose';
import _NextAuth from 'next-auth';

declare global {
  var mongoose: {
    conn: typeof _mongoose | null;
    promise: Promise<typeof _mongoose> | null;
  };
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
