import { writable } from "svelte/store";
interface User {
  firstName: string;
  lastName: string;
  email: string;
}
// Create a writable store that is initialized with data from a JWT in localStorage that may or may not exist
export const user = writable<User>({
  firstName: "",
  lastName: "",
  email: "",
});

export const authorizedApps = writable<string[]>(
  localStorage.getItem("authorizedApps")
    ? localStorage.getItem("authorizedApps").split(",")
    : []
);

authorizedApps.subscribe((value) => {
  localStorage.setItem("authorizedApps", value.join(","));
});

if (localStorage.getItem("supersecrettoken")) {
  const token = localStorage.getItem("supersecrettoken");
  const payload = JSON.parse(
    atob(token.split(".")[1].replace("-", "+").replace("_", "/"))
  );
  user.set({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
  });
}
