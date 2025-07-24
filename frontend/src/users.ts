import { isRecord } from "./types";

export type User = {
  name: string;
  email: string;
};

export const parseUser = (data: unknown): User => {
  if (!isRecord(data)) {
    throw new Error(`data is not a record: ${typeof data}`);
  }
  if (typeof data.name !== "string") {
    throw new Error(`data.name is not a string: ${typeof data.name}`);
  }
  if (typeof data.email !== "string") {
    throw new Error(`data.email is not a string: ${typeof data.email}`);
  }

  return {
    name: data.name,
    email: data.email,
  };
};
