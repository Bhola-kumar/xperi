import { authorizeUser } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");

  loginButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = await authorizeUser();
    if (email) {
      window.location.href = "/dashboard";
    }
  });
});
