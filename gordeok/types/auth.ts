export type SignupRequest = {
  nickname: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type SignupResponse = {
  userId: number;
  message: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  userId: number;
  nickname: string;
  message: string;
};