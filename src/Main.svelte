<script lang="ts">
  import { onMount } from "svelte";
  import { token, user } from "./stores";
  import { get } from "svelte/store";
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("token")) {
      token.set(urlParams.get("token"));
      urlParams.delete("token");
      window.history.replaceState({}, "", `${window.location.pathname}`);
      console.log("Token set from URL");
    }
    if (localStorage.getItem("token")) {
      const localToken = localStorage.getItem("token");
      const payload = JSON.parse(
        atob(localToken.split(".")[1].replace(/_/g, "/").replace(/-/g, "+"))
      );
      if (payload.exp < Date.now() / 1000) {
        localStorage.removeItem("token");
        token.set("");
        user.set({
          firstName: "",
          lastName: "",
          email: "",
          authorizedApps: [],
        });
        return;
      }
      token.set(localStorage.getItem("token"));
      console.log("Token set from local storage");
    }
    let redirect = "";
    // The user may or may not be signed in. We don't know if they want to go to a page
    if (urlParams.has("redirect")) {
      // In this case we know the user, in this session, wants to go to a page.
      redirect = urlParams.get("redirect");
      urlParams.delete("redirect");
      window.history.replaceState({}, "", `${window.location.pathname}`);
    } else if (localStorage.getItem("redirect")) {
      // In this case we know the user, in a previous session, wanted to go to a page.
      redirect = localStorage.getItem("redirect");
    }

    if (redirect) {
      if (!get(token)) {
        localStorage.setItem("redirect", redirect);
        // We save the redirect URL in case the user logs in in the future
        return;
      }
      if (
        localStorage
          .getItem("authorized_apps")
          ?.split(",")
          .includes(new URL(redirect).origin)
      ) {
        // Add the token to the redirect URL
        const redirectURL = new URL(redirect);
        (async () => {
          console.log(get(token));
          const res = await fetch(
            "http://localhost:3001/token?audience=" + redirectURL.origin,
            {
              headers: {
                Authorization: get(token),
              },
            }
          );
          const gottoken = await res.text();
          redirectURL.searchParams.append("token", gottoken);
          localStorage.removeItem("redirect");
          window.location.href = redirectURL.href;
        })();
      }
    }
    token.subscribe((string) => {
      if (string) {
        console.log("Token set from token store");
        localStorage.setItem("token", string);
        const payload = JSON.parse(atob(string.split(".")[1]));
        user.set({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          authorizedApps: localStorage.getItem("authorizedApps")
            ? localStorage.getItem("authorizedApps").split(",")
            : [],
        });
      } else {
        console.log("Token removed from token store");
        localStorage.removeItem("token");
        user.set({
          firstName: "",
          lastName: "",
          email: "",
          authorizedApps: [],
        });
      }
    });
  });
</script>

<main class="m-8">
  <h1 class="text-4xl">
    {#if $token === ""}
      Welcome to NT3 identity!
    {:else}
      Welcome back, {$user.firstName}
    {/if}
  </h1>
  {#if $token === ""}
    <p class="text-xl">Please log in to continue.</p>
    <button
      on:click={async () => {
        const modal = document.getElementById("signup");
        // @ts-ignore
        modal.showModal();
      }}
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-indigo-500 text-white hover:bg-opacity-90"
    >
      Create an account
    </button>
    <button
      type="button"
      id="btn"
      on:click={() => {
        token.set("");
        user.set({
          firstName: "",
          lastName: "",
          email: "",
          authorizedApps: [],
        });
        const dialog = document.getElementById("magic");
        // @ts-ignore
        dialog.showModal();
      }}
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-indigo-500 text-white hover:bg-opacity-90"
    >
      Log in with Email
    </button>
  {:else}
    <p class="text-xl">
      You are logged in as {$user.email}. Glad to see you again!
    </p>
    <button
      type="button"
      id="btn"
      on:click={() => {
        token.set("");
        user.set({
          firstName: "",
          lastName: "",
          email: "",
          authorizedApps: [],
        });
      }}
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-indigo-500 text-white hover:bg-opacity-90"
    >
      Log out
    </button>
  {/if}
</main>
<!-- Magic link dialog, asking for email -->
<dialog id="magic" class="p-6 bg-neutral-800 text-white">
  <h2>Log in with an email</h2>
  <form
    on:submit|preventDefault={async () => {
      // @ts-ignore
      const email = document.getElementById("magic-email").value;
      const response = await fetch(
        "http://localhost:3001/getMagic/" +
          email +
          (new URLSearchParams(window.location.search).has("redirect")
            ? "?redirect=" +
              new URLSearchParams(window.location.search).get("redirect")
            : "")
      );
      if (response.status === 200) {
        const dialog = document.getElementById("magic");
        // @ts-ignore
        dialog.close();
        alert("Check your email for a magic link! Now, please close this tab.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    }}
  >
    <input
      type="email"
      id="magic-email"
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-neutral-700"
    />
    <button class="rounded px-5 py-3 bg-primary hover:bg-primaryHover"
      >Submit</button
    >
  </form>
</dialog>
<dialog id="signup" class="p-6 bg-neutral-800 text-white">
  <h2>Sign up</h2>
  <form
    class="flex flex-col gap-4"
    on:submit|preventDefault={async () => {
      // @ts-ignore
      const email = document.getElementById("signup-email").value;
      // @ts-ignore
      const firstName = document.getElementById("signup-firstname").value;
      // @ts-ignore
      const lastName = document.getElementById("signup-lastname").value;
      // @ts-ignore
      const displayName = document.getElementById("signup-displayname").value;

      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        body: JSON.stringify({
          email: email,
          firstName: firstName,
          lastName: lastName,
          displayName: displayName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 200) {
        const dialog = document.getElementById("signup");
        // @ts-ignore
        dialog.close();
        alert("Awesome! Now, log in with any login method.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    }}
  >
    <input
      type="text"
      placeholder="Unshared email"
      id="signup-email"
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-neutral-700"
    />
    <input
      type="text"
      placeholder="Optional, unshared first name"
      id="signup-firstname"
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-neutral-700"
    />
    <input
      type="text"
      placeholder="Optional, unshared last name"
      id="signup-lastname"
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-neutral-700"
    />
    <input
      type="text"
      required
      placeholder="Display name"
      id="signup-displayname"
      class="rounded px-5 py-3 min-w-max overflow-hidden shadow relative bg-neutral-700"
    />
    <button class="rounded px-5 py-3 bg-primary hover:bg-primaryHover"
      >Submit</button
    >
  </form>
</dialog>
