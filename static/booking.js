const apiUrl = window.apiUrl;

// display name and email
function displayUserInfo(userData) {
  const nameSpan = document.querySelectorAll(".name-span");
  const nameInput = document.getElementById("your-name");
  const emailInput = document.getElementById("your-email");

  if (userData.name) {
    nameSpan.forEach((span) => (span.textContent = userData.name));
    nameInput.value = userData.name;
  }
  if (userData.email) {
    emailInput.value = userData.email;
  }
}

function fetchUserInfo() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    console.log("請登入再進行預訂");
    return;
  }

  fetch(`${apiUrl}/api/user/auth`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data && data.data) {
        displayUserInfo(data.data);
      } else {
        console.log("error");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

document.addEventListener("DOMContentLoaded", fetchUserInfo);

// fetch get /booking
function getBookingInfo() {
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    window.location.href = "/";
    return;
  }

  fetch("/api/booking", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (response.status === 403) {
        localStorage.removeItem("jwtToken");
        window.location.href = "/";
        throw new Error("請重新登入");
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        renderNoBooking();
      }
      if (data.data) {
        renderBookingData(data.data);
      } else {
        renderNoBooking();
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function renderBookingData(bookingInfo) {
  document.getElementById("booking-0").style.display = "none";
  document.getElementById("booking-1").style.display = "flex";
  document.getElementById("booking-2").style.display = "flex";
  document.getElementById("booking-3").style.display = "flex";
  document.getElementById("booking-4").style.display = "flex";
  document.querySelector(".footer").style.height = "104px";

  document.getElementById("image").src = bookingInfo.attraction.image;
  document.getElementById("attraction-span").textContent =
    bookingInfo.attraction.name;
  document.getElementById("date-span").textContent = bookingInfo.date;
  document.getElementById("time-span").textContent = bookingInfo.time;
  document.getElementById("price-span").textContent = bookingInfo.price;
  document.getElementById("address-span").textContent =
    bookingInfo.attraction.address;
}

function renderNoBooking() {
  document.getElementById("booking-0").style.display = "flex";
  document.getElementById("booking-1").style.display = "none";
  document.getElementById("booking-2").style.display = "none";
  document.getElementById("booking-3").style.display = "none";
  document.getElementById("booking-4").style.display = "none";
  document.querySelector(".footer").style.height = "100vh";
  document.querySelector(".footer").style.alignItems = "unset";
  document.querySelector(".footer").style.paddingTop = "40px";
}

function checkLoginStatus() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    window.location.href = "/";
  } else {
    getBookingInfo();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  getBookingInfo();
});

// fetch delete /booking
function setupDeleteButton() {
  const deleteBtn = document.getElementById("delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteBooking);
  }
}

function deleteBooking() {
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    alert("請登入以繼續");
    return;
  }

  if (confirm("確定要刪除此預訂嗎？")) {
    fetch("/api/booking", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          location.reload();
        } else {
          throw new Error(data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert(error.message);
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getBookingInfo();
  setupDeleteButton();
});
