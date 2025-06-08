const apps = [
  {
    name: "Dashboard",
    icon: "/images/icons/dashboard.svg",
    url: "/dashboard",
  },
  {
    name: "Mail Management",
    icon: "/images/icons/mail.svg",
    url: "/mail-management",
  },
  {
    name: "Preprocessing",
    icon: "/images/icons/transform.svg",
    url: "/preprocessing",
  },
  {
    name: "TV Metadata",
    icon: "/images/icons/tv.svg",
    url: "/matching",
  },
  {
    name: "QA Engine",
    icon: "/images/icons/qa.svg",
    url: "/data-accuracy/jobs",
  },
  {
    name: "Report Validation",
    icon: "/images/icons/validation.svg",
    url: "/validation",
  },
  {
    name: "Virtual Assistant",
    icon: "/images/icons/chat.svg",
    url: "/virtual-assistant",
  },
];

function initAppSwitcher() {
  const modal = document.getElementById("appSwitcherModal");
  const button = document.getElementById("appSwitcherButton");
  const appGrid = document.getElementById("appGrid");

  // Populate app grid
  apps.forEach((app) => {
    const appItem = document.createElement("a");
    appItem.href = app.url;
    appItem.className = "app-item";
    appItem.innerHTML = `
      <img src="${app.icon}" alt="${app.name}" class="app-icon">
      <span class="app-name">${app.name}</span>
    `;
    appGrid.appendChild(appItem);
  });

  // Toggle modal
  button.addEventListener("click", (e) => {
    e.preventDefault();
    modal.style.display = "block";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Close modal when pressing Escape
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.style.display = "none";
    }
  });
}
