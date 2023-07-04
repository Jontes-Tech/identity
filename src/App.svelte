<script lang="ts">
  import { user } from "./stores";
  const greetings = ["Hello", "Hi", "Hey", "Howdy", "Greetings"];
  let showModal: "login" | "signup" | "" = "";
  const params = new URLSearchParams(window.location.search);
  const redirectURI = params.get("redirect_uri") || "";
  let authorized = false;
  async function ok() {
    const url = new URL(redirectURI);
    const fetched = await fetch(
      "https://api.jontes.page/token?audience=" +
        encodeURIComponent(redirectURI),
      {
        headers: {
          Authorization: localStorage.getItem("supersecrettoken") || "",
        },
      }
    );
    const token = await fetched.text();
    url.searchParams.set("token", token);
    location.href = url.href;
  }
  // If redirect, check if the redirect URI is authorized.
  if (
    redirectURI &&
    localStorage
      .getItem("authorizedApps")
      ?.split(",")
      .includes(new URL(redirectURI).origin)
  ) {
    authorized = true;
    // Redirect to redirect URI, but add the token as a query parameter. Use new URI, because the redirect URI might have a query string already.
    ok();
  }

  const thatToken = localStorage.getItem("supersecrettoken");
  if (thatToken) {
    // Check if the token is valid.
    const payload = JSON.parse(
      atob(thatToken.split(".")[1].replace("-", "+").replace("_", "/"))
    );
    if (payload.exp < Date.now() / 1000) {
      user.set({
        firstName: "",
        lastName: "",
        email: "",
      });
      localStorage.removeItem("supersecrettoken");
    }
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      showModal = "";
    }
  });

  let jonteApps = ["jontes.page"];
</script>

{#if redirectURI === ""}
  <main class="m-12">
    <h1 class="text-4xl font-bold mb-4">
      Welcome to <span class="rounded p-2 bg-violet-500">NT3 Identity</span>
    </h1>
    {#if $user.firstName !== ""}
      <p>
        {greetings[Math.floor(Math.random() * greetings.length)]}
        {$user.firstName}! Do you feel like having a look at your authorized
        apps today?
      </p>
      <div class="flex flex-col">
        <ul
          class="h-16 w-full max-w-xl bg-neutral-800 rounded mt-2 inline-block"
        >
          <li class="h-12 m-2 w-12 bg-neutral-700 rounded inline-block" />
        </ul>
        <button
          on:click={() => {
            localStorage.removeItem("supersecrettoken");
            user.set({
              firstName: "",
              lastName: "",
              email: "",
            });
          }}
          class="text-left">Log out</button
        >
      </div>
    {:else}
      <p>Log in to all of the Jonte ecosystem with one simple account.</p>
      <button
        class="p-2 mt-2 rounded bg-neutral-700"
        on:click={() => {
          showModal = "login";
        }}>Log in</button
      >
      or
      <button
        class="p-2 mt-2 rounded bg-neutral-700"
        on:click={() => {
          showModal = "signup";
        }}>Sign Up</button
      >
    {/if}
  </main>
{:else}
  <!-- We are in a redirect-back -->
  {#if authorized === true}
    <p class="text-4xl m-12">Redirecting to an authorized application</p>
  {:else}
    <!-- Centered card -->
    <main class="flex items-center justify-center h-screen">
      <div class="bg-neutral-800 rounded-lg shadow-lg p-6 mx-auto">
        <h2 class="text-2xl font-medium">
          Would you like to authorize "{new URL(redirectURI).hostname}"
        </h2>
        {#if !jonteApps.includes(new URL(redirectURI).hostname)}
          <div
            class="flex p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800"
            role="alert"
          >
            <svg
              aria-hidden="true"
              class="flex-shrink-0 inline w-5 h-5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
              ><path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              /></svg
            >
            <span class="sr-only">Info</span>
            <div>
              <span class="font-medium">Warning!</span> This app is not approved
              by Jonte.
            </div>
          </div>
        {/if}
        <p class="text-gray-200">
          An {jonteApps.includes(new URL(redirectURI).hostname)
            ? "approved"
            : "external"} app wants access to your NT3 Identity. This gives it:
        </p>
        <ul>
          <li class="list-disc">Your email</li>
          <li class="list-disc">Your first- and last name</li>
          <li class="list-disc">Your NT3 ID</li>
        </ul>
        <button
          on:click={() => {
            // Append the origin to authorizedApps, which may be empty
            if (localStorage.getItem("authorizedApps")) {
              let existing = localStorage.getItem("authorizedApps").split(",");
              existing.push(new URL(redirectURI).origin);
              localStorage.setItem("authorizedApps", existing.join(","));
            } else {
              localStorage.setItem(
                "authorizedApps",
                new URL(redirectURI).origin
              );
            }
            if ($user.firstName === "") {
              showModal = "signup";
            } else {
              ok();
            }
          }}
          class="p-1 bg-violet-700 rounded">Authorize</button
        >
      </div>
    </main>
  {/if}
{/if}

{#if showModal !== ""}
  <form
    on:submit|preventDefault={async () => {
      const data = Object.fromEntries(
        new FormData(document.querySelector("form"))
      );
      if (data.firstName === "") data.firstName = "John";
      if (data.lastName === "") data.lastName = "Doe";
      if (showModal === "signup") {
        const fetched = await fetch("https://api.jontes.page/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (fetched.status === 200) {
          const token = await fetched.text();
          localStorage.setItem("supersecrettoken", token);
          const payload = JSON.parse(
            atob(token.split(".")[1].replace("-", "+").replace("_", "/"))
          );
          user.set({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
          });
          if (redirectURI) {
            ok();
          }
          alert("Account created!");
          showModal = "";
        } else {
          alert("Something went wrong!");
        }
      } else {
        const fetched = await fetch("https://api.jontes.page/identityToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });
        if (fetched.status === 200) {
          const token = await fetched.text();
          localStorage.setItem("supersecrettoken", token);
          const payload = JSON.parse(
            atob(token.split(".")[1].replace("-", "+").replace("_", "/"))
          );
          user.set({
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
          });
          showModal = "";
        } else {
          alert("Something went wrong!");
        }
      }
    }}
    class="fixed inset-0 z-50 flex items-center justify-center"
  >
    <div>
      <div
        class="rounded-xl border bg-neutral-800 text-card-foreground shadow w-96"
      >
        <div class="flex flex-col p-6 space-y-1">
          <h3 class="font-semibold tracking-tight text-2xl">
            {showModal === "signup" ? "Create an account" : "Log In"}
          </h3>
          <button
            class="absolute top-0 right-0 m-4 text-neutral-400"
            on:click={() => (showModal = "")}
          >
            <kbd class="p-1 bg-neutral-800">ESC</kbd> to close modal
          </button>
          <p class="text-sm text-muted-foreground">
            {#if showModal === "signup"}
              Do you instead want to <button
                class="hover:underline"
                on:click={() => {
                  showModal = "login";
                }}>Log in?</button
              >
            {:else}
              Not part of the club? <button
                class="hover:underline"
                on:click={() => {
                  showModal = "signup";
                }}>Create an account!</button
              >
            {/if}
          </p>
        </div>
        <div class="p-6 pt-0 grid gap-4">
          <!-- <div class="grid grid-cols-2 gap-6">
                      <button
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-800 shadow-sm hover:bg-violet-400 hover:text-accent-foreground h-9 px-4 py-2"
                        ><svg viewBox="0 0 438.549 438.549" class="mr-2 h-4 w-4"
                          ><path
                            fill="currentColor"
                            d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
                          /></svg
                        >Github</button
                      ><button
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-neutral-800 shadow-sm hover:bg-violet-400 hover:text-accent-foreground h-9 px-4 py-2"
                        ><svg role="img" viewBox="0 0 24 24" class="mr-2 h-4 w-4"
                          ><path
                            fill="currentColor"
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          /></svg
                        >Google</button
                      >
                    </div>
                    <div class="relative">
                      <div class="absolute inset-0 flex items-center">
                        <span class="w-full border-t" />
                      </div>
                      <div class="relative flex justify-center text-xs uppercase">
                        <span class="bg-neutral-800 px-2 text-muted-foreground"
                          >Or continue with</span
                        >
                      </div>
                    </div> -->
          <div class="grid gap-2">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="email">Email</label
            ><input
              class="flex h-9 w-full rounded-md border border-input bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              id="email"
              name="email"
              placeholder="jonatan@jontes.page"
              type="email"
              required
            />
          </div>
          <div class="grid gap-2">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              for="password">Password</label
            ><input
              class="flex h-9 w-full rounded-md border border-input bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              id="password"
              name="password"
              minlength="12"
              required
              type="password"
            />
          </div>
          {#if showModal === "signup"}
            <div class="grid gap-2">
              <label
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                for="password">Name</label
              >
              <div class="flex flex-row gap-x-2">
                <input
                  placeholder="John"
                  name="firstName"
                  class="flex h-9 w-full rounded-md border border-input bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  placeholder="Doe"
                  name="lastName"
                  class="flex h-9 w-full rounded-md border border-input bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p class="text-xs text-gray-300">
                Optional, confidential by default.
              </p>
              <label
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                for="password">Display name</label
              >
              <input
                name="displayName"
                placeholder="John Doe"
                class="flex h-9 w-full rounded-md border border-input bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          {/if}
        </div>
        <div class="flex items-center p-6 pt-0">
          <button
            class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-violet-800 text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
            >{showModal === "signup" ? "Sign up" : "Login"}</button
          >
        </div>
      </div>
    </div>
  </form>
{/if}
