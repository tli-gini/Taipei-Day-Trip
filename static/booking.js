const apiUrl = window.apiUrl;

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

function fetchUserInfo() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    console.log("請登入再進行預訂");
    return;
  }

  if (sessionStorage.getItem("userData")) {
    displayUserInfo(JSON.parse(sessionStorage.getItem("userData")));
    getBookingInfo();
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
        sessionStorage.setItem("userData", JSON.stringify(data.data));
        displayUserInfo(data.data);
        getBookingInfo();
      } else {
        console.log("User data fetch error");
      }
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });
}

function getBookingInfo() {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    window.location.href = "/";
    return;
  }

  if (sessionStorage.getItem("bookingInfo")) {
    renderBookingData(JSON.parse(sessionStorage.getItem("bookingInfo")));
    return;
  }

  fetch("/api/booking", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        renderNoBooking();
      } else if (data.data) {
        sessionStorage.setItem("bookingInfo", JSON.stringify(data.data));
        renderBookingData(data.data);
      } else {
        renderNoBooking();
      }
    })
    .catch((error) => {
      console.error("Error fetching booking info:", error);
    });
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
          sessionStorage.removeItem("bookingInfo");
          renderNoBooking();
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

function setupDeleteButton() {
  const deleteBtn = document.getElementById("delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteBooking);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("jwtToken");
  if (!token) {
    window.location.href = "/";
    return;
  }

  setupUserInfoAndBooking();
});

function setupUserInfoAndBooking() {
  if (sessionStorage.getItem("userData")) {
    displayUserInfo(JSON.parse(sessionStorage.getItem("userData")));
    if (sessionStorage.getItem("bookingInfo")) {
      renderBookingData(JSON.parse(sessionStorage.getItem("bookingInfo")));
    } else {
      getBookingInfo();
    }
  } else {
    fetchUserInfo();
  }
  setupDeleteButton();
}
