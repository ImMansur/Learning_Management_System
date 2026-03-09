export interface User {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const users: User[] = [
  { email: "immansurjavid@gmail.com", password: "123", name: "Mansur Javid", role: "Learner" },
  { email: "trainer@gmail.com", password: "123", name: "Sara", role: "Trainer" },
  { email: "admin@gmail.com", password: "123", name: "James", role: "Admin" },
];