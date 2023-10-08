<script lang="ts">
  // Let's validate the user's session, locally.
  import "@passageidentity/passage-elements/passage-auth";
  import "@passageidentity/passage-elements/passage-passkey-table";
  import type { PassageElement } from "@passageidentity/passage-elements";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  let loggedIn = writable(false);

  if (
    localStorage.getItem("psg_auth_token") &&
    JSON.parse(
      window.atob(localStorage.getItem("psg_auth_token").split(".")[1])
    ).exp >
      Date.now() / 1000
  ) {
    console.log("User is logged in!");
    loggedIn.set(true);
  } else {
    onMount(() => {
      const auth = document.querySelector<PassageElement>("passage-auth");
      console.log(auth);
      auth.onSuccess = () => {
        loggedIn.set(true);
        console.log("User is logged in!");
        window.location.reload();
      };
    });
  }

  const redirect = {
    blog: {
      url: /^https:\/\/jontes\.page\/blog\/.*/,
      name: "Jonte's Blog",
      scope: "read:admin read:display_name",
    },
  };

  interface Scope {
    fancy: string;
    type: string;
    disabled?: boolean;
  }
  const scopes: Record<string, Scope> = {
    displayName: {
      fancy: "Display name",
      type: "text",
    },
    email: {
      fancy: "Email",
      type: "email",
      disabled: true,
    },
    firstName: {
      fancy: "First name",
      type: "text",
    },
    lastName: {
      fancy: "Last name",
      type: "text",
    },
    admin: {
      fancy: "Admin",
      type: "checkbox",
      disabled: true,
    },
    hue: {
      fancy: "Hue",
      type: "color",
    },
    id: {
      fancy: "ID",
      type: "text",
      disabled: true,
    },
    passageId: {
      fancy: "Passage ID",
      type: "text",
      disabled: true,
    },
  };
  const snakeToCamel = (str) =>
    str
      .toLowerCase()
      .replace(/[-_][a-z]/g, (group) => group.slice(-1).toUpperCase());

  // Regex matches the url
  const findObj = () => {
    const url = new URLSearchParams(location.search).get("redirect");
    for (const [key, value] of Object.entries(redirect)) {
      if (value.url.test(url)) {
        return value;
      }
    }
  };
  let me = {
    displayName: "Loading...",
    email: "Loading...",
  };
  (async () => {
    const res = await fetch("https://api.jontes.page/me", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("psg_auth_token"),
      },
    });
    if (!res.ok) {
      location.href = "/" + location.search + "#login";
    }
    const json = await res.json();
    me = json;
  })();
</script>

{#if !$loggedIn}
  <div class="h-screen grid place-items-center">
    <passage-auth app-id="DuBvcJhhoGlIdQeeyW6fRArD" />
  </div>
{:else if new URLSearchParams(location.search).get("redirect")}
  <div class="m-8 max-w-xl mx-auto">
    <p>
      To authorize {findObj().name}, you must confirm the following details it
      requests
    </p>
    <form
      on:submit|preventDefault={async () => {
        // @ts-ignore
        const data = new FormData(event.target);
        const body = {};
        for (const [key, value] of data.entries()) {
          body[key] = value;
        }
        const thatRedirect = new URLSearchParams(location.search).get(
          "redirect"
        );
        // Get that url, and redirect to it with the token
        const url = new URL(thatRedirect);

        const res = await fetch(
          "https://api.jontes.page/token?audience=" +
            encodeURIComponent(new URL(thatRedirect).origin) +
            "&scope=" +
            encodeURIComponent(findObj().scope),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("psg_auth_token"),
            },
            body: JSON.stringify(body),
          }
        );
        url.searchParams.set("token", await res.text());
        location.href = url.href;
      }}
    >
      {#each findObj().scope.split(" ") as scope}
        {#if !scopes[snakeToCamel(scope.split(":")[1])].disabled}
          <div class="w-full">
            <input
              value={me[snakeToCamel(scope.split(":")[1])]}
              name={snakeToCamel(scope.split(":")[1])}
              placeholder={scopes[snakeToCamel(scope.split(":")[1])].fancy}
              type={scopes[snakeToCamel(scope.split(":")[1])].type}
              required
              class="border-2 border-gray-300 rounded-md p-2 my-2 w-full text-white bg-black"
            />
          </div>
        {/if}
      {/each}
      <button
        type="submit"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Submit
      </button>
    </form>
  </div>
{:else}
  <div class="m-8 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold">
      Logged in as {(me.email !== "Loading..." && me.email) ||
        "maybe " + localStorage.getItem("psg_last_login") ||
        "someone@example.com"}
    </h1>
    <p class="mb-2">Here is a list of your devices.</p>
    <passage-passkey-table app-id="DuBvcJhhoGlIdQeeyW6fRArD" />
    <p>This is literally all we know about ya</p>
    <pre>{JSON.stringify(me, null, 2)}</pre>
  </div>
{/if}
