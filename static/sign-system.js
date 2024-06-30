window.apiUrl = "http://127.0.0.1:8000"; //remember to change
console.log(apiUrl);

// var attractionId = require("./attraction");
// console.log("attractionId: ", attractionId);
// Dialogs
const signinDialog = document.querySelector("#signin-dialog");
const signupDialog = document.querySelector("#signup-dialog");
const closeSigninBtn = document.querySelector("#signin-close-btn");
const closeSignupBtn = document.querySelector("#signup-close-btn");
const linkToSignup = document.querySelector("#link-to-signup");
const linkToSignin = document.querySelector("#link-to-signin");

// Open signin dialog
function openSignin() {
  signupDialog.close();
  signinDialog.showModal();
}

// Open signup dialog
function openSignup() {
  signinDialog.close();
  signupDialog.showModal();
}

linkToSignup.addEventListener("click", openSignup);
linkToSignin.addEventListener("click", openSignin);

closeSigninBtn.addEventListener("click", () => {
  signinDialog.close();
});

closeSignupBtn.addEventListener("click", () => {
  signupDialog.close();
});

// signup sys
const signupNameInput = document.querySelector("#signup-name");
const signupEmailInput = document.querySelector("#signup-email");
const signupPwdInput = document.querySelector("#signup-pwd");
const signupButton = document.querySelector("#signup-btn");
const signupDataMsg = document.querySelector("#signup-data-msg");

const userSignup = () => {
  const userData = {
    name: signupNameInput.value,
    email: signupEmailInput.value,
    password: signupPwdInput.value,
  };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  };
  fetch(`${apiUrl}/api/user`, options)
    .then((response) => response.json())
    .then((data) => {
      if (data.ok) {
        console.log(data.message);
        showMessage(data.message, false);
      } else {
        console.error(data.message);
        showMessage(data.message, true);
      }
    })
    .catch((data) => {
      console.error(data.message);
      showMessage(data.message, true);
    });
};

function showMessage(msg, error) {
  signupDataMsg.style.display = "block";
  signupDataMsg.textContent = msg;
  signupDataMsg.style.color = error ? "red" : "green";
}

signupButton.addEventListener("click", (event) => {
  event.preventDefault();
  userSignup();
});

// signin sys
// user status
document.addEventListener("DOMContentLoaded", function () {
  const signinButton = document.getElementById("signin-btn");
  const signinEmailInput = document.getElementById("signin-email");
  const signinPwdInput = document.getElementById("signin-pwd");
  const signinDataMsg = document.getElementById("signin-data-msg");
  const signOutButton = document.getElementById("signout-btn");
  const signMenu = document.getElementById("sign-btn");

  function checkUserStatus() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      signMenu.style.display = "block";
      signOutButton.style.display = "none";
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
        if (data.data) {
          signMenu.style.display = "none";
          signOutButton.style.display = "block";
        } else {
          signMenu.style.display = "block";
          signOutButton.style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        signMenu.style.display = "block";
        signOutButton.style.display = "none";
      });
  }
  checkUserStatus();

  signinButton.addEventListener("click", function (event) {
    event.preventDefault();
    userSignIn();
  });

  signOutButton.addEventListener("click", function (event) {
    event.preventDefault();
    userSignOut();
  });

  function userSignIn() {
    const email = signinEmailInput.value;
    const password = signinPwdInput.value;

    fetch(`${apiUrl}/api/user/auth`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("jwtToken", data.token);
          location.reload();
        } else {
          signinDataMsg.textContent = data.message;
          signinDataMsg.style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        signinDataMsg.textContent = "登入系統發生錯誤";
        signinDataMsg.style.display = "block";
      });
  }

  function userSignOut() {
    localStorage.removeItem("jwtToken");
    location.reload();
  }
});

// Connect to booking page
function isUserSignedIn() {
  const token = localStorage.getItem("jwtToken");
  return token !== null;
}

function handleBookingClick() {
  if (isUserSignedIn()) {
    window.location.href = "/booking";
  } else {
    openSignin();
  }
}

const bookBtn = document.querySelector("#book-btn");
bookBtn.addEventListener("click", handleBookingClick);
