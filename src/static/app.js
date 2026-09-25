document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authStatus = document.getElementById("auth-status");
  const authMessage = document.getElementById("auth-message");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showLoginButton = document.getElementById("show-login");
  const showRegisterButton = document.getElementById("show-register");

  let currentUser = null;

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = type;
    element.classList.remove("hidden");
  }

  function hideMessage(element) {
    element.classList.add("hidden");
  }

  function setAuthView(view) {
    const isLoginView = view === "login";
    loginForm.classList.toggle("hidden", !isLoginView);
    registerForm.classList.toggle("hidden", isLoginView);
    showLoginButton.classList.toggle("active", isLoginView);
    showRegisterButton.classList.toggle("active", !isLoginView);
  }

  function setAuthenticatedUser(user) {
    currentUser = user;
    if (user) {
      authStatus.textContent = `Signed in as ${user.first_name} ${user.last_name} (${user.email})`;
      authStatus.classList.remove("hidden");
      loginForm.classList.add("hidden");
      registerForm.classList.add("hidden");
      showLoginButton.classList.remove("active");
      showRegisterButton.classList.remove("active");
    } else {
      authStatus.classList.add("hidden");
      authStatus.textContent = "";
      setAuthView("login");
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await fetch("/me");
      if (!response.ok) {
        setAuthenticatedUser(null);
        return;
      }
      const user = await response.json();
      setAuthenticatedUser(user);
    } catch (error) {
      setAuthenticatedUser(null);
    }
  }

  async function submitAuthForm(form, endpoint, successText) {
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(authMessage, successText || result.message, "success");
        setAuthenticatedUser(result.user);
        form.reset();
        document.getElementById("activities-container").scrollIntoView({ behavior: "smooth" });
      } else {
        showMessage(authMessage, result.detail || "Authentication failed.", "error");
      }
    } catch (error) {
      showMessage(authMessage, "Authentication request failed. Please try again.", "error");
      console.error("Auth error:", error);
    }
  }

  showLoginButton.addEventListener("click", () => setAuthView("login"));
  showRegisterButton.addEventListener("click", () => setAuthView("register"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    };
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (response.ok) {
      showMessage(authMessage, result.message, "success");
      setAuthenticatedUser(result.user);
      loginForm.reset();
      document.getElementById("activities-container").scrollIntoView({ behavior: "smooth" });
    } else {
      showMessage(authMessage, result.detail || "Invalid email or password.", "error");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      first_name: document.getElementById("register-first-name").value,
      last_name: document.getElementById("register-last-name").value,
      email: document.getElementById("register-email").value,
      password: document.getElementById("register-password").value,
    };
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (response.ok) {
      showMessage(authMessage, result.message, "success");
      setAuthenticatedUser(result.user);
      registerForm.reset();
      document.getElementById("activities-container").scrollIntoView({ behavior: "smooth" });
    } else {
      showMessage(authMessage, result.detail || "Registration failed.", "error");
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(messageDiv, "Please log in before signing up for an activity.", "error");
      return;
    }

    const email = document.getElementById("email").value || currentUser.email;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  fetchCurrentUser();
  fetchActivities();
});
