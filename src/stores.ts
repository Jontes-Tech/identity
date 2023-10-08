import { writable } from "svelte/store";
interface User {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
  hue: number;
}
export const user = writable<User>({
  firstName: "",
  lastName: "",
  email: "",
  displayName: "",
  hue: 0,
});

export const token = writable<string>("");