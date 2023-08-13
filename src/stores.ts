import { writable } from "svelte/store";
interface User {
  firstName: string;
  lastName: string;
  email: string;
  authorizedApps: string[];
}
export const user = writable<User>({
  firstName: "",
  lastName: "",
  email: "",
  authorizedApps: [],
});

export const token = writable<string>("");