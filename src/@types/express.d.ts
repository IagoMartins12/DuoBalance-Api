declare namespace Express {
  interface User {
    id: string;
    email: string;
    name: string;
    photo: string | null;
    color: string;
  }
}
