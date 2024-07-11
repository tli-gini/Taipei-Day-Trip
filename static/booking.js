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
  document.getElementById("booking-price-span").textContent = bookingInfo.price;
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
    console.log("請登入以繼續");
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
      } else {
        renderBookingData(data.data);
      }
    })
    .catch((error) => {
      console.error("Error fetching booking info:", error);
      renderNoBooking();
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
  fetchUserInfo();
  setupDeleteButton();
});

// Payment: TapPay
fetch("/config")
  .then((response) => response.json())
  .then((config) => {
    TPDirect.setupSDK(config.APP_ID, config.APP_KEY, "sandbox");

    // TapPay GetPrime
    TPDirect.card.setup({
      fields: {
        number: {
          element: "#tappay-card-number",
          placeholder: "**** **** **** ****",
        },
        expirationDate: {
          element: "#tappay-expiration-date",
          placeholder: "MM / YY",
        },
        ccv: {
          element: "#tappay-ccv",
          placeholder: "後三碼",
        },
      },
      styles: {
        input: {
          color: "gray",
        },
        "input.ccv": {},
        ":focus": {
          color: "black",
        },
        ".valid": {
          color: "green",
        },
        ".invalid": {
          color: "red",
        },
        "@media screen and (max-width: 400px)": {
          input: {
            color: "orange",
          },
        },
      },
      isMaskCreditCardNumber: true,
      maskCreditCardNumberRange: {
        beginIndex: 6,
        endIndex: 11,
      },
    });

    // Listen for TapPay Field
    TPDirect.card.onUpdate(function (update) {
      if (update.canGetPrime) {
        $("#submit-button").removeAttr("disabled");
      } else {
        $("#submit-button").attr("disabled", true);
      }

      var newType = update.cardType === "unknown" ? "" : update.cardType;
      $("#cardtype").text(newType);

      if (update.status.number === 2) {
        setNumberFormGroupToError(".card-number-group");
      } else if (update.status.number === 0) {
        setNumberFormGroupToSuccess(".card-number-group");
      } else {
        setNumberFormGroupToNormal(".card-number-group");
      }

      if (update.status.expiry === 2) {
        setNumberFormGroupToError(".expiration-date-group");
      } else if (update.status.expiry === 0) {
        setNumberFormGroupToSuccess(".expiration-date-group");
      } else {
        setNumberFormGroupToNormal(".expiration-date-group");
      }

      if (update.status.ccv === 2) {
        setNumberFormGroupToError(".ccv-group");
      } else if (update.status.ccv === 0) {
        setNumberFormGroupToSuccess(".ccv-group");
      } else {
        setNumberFormGroupToNormal(".ccv-group");
      }
    });

    // Handle form submission
    $("#payment-form").on("submit", function (event) {
      event.preventDefault();

      forceBlurIos();

      const tappayStatus = TPDirect.card.getTappayFieldsStatus();
      if (tappayStatus.canGetPrime === false) {
        alert("無法取得付款資料，請再試一次");
        return;
      }

      const token = localStorage.getItem("jwtToken");
      if (!token) {
        alert("請登入以繼續");
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
        .then((bookingData) => {
          if (bookingData.error || !bookingData.data) {
            alert(
              "No active booking found or booking fetch error: " +
                bookingData.message
            );
            return;
          }

          TPDirect.card.getPrime(function (result) {
            if (result.status !== 0) {
              alert("付款系統出現錯誤，請再試一次");
              return;
            }

            const contactPhone = document.getElementById("your-phone").value;
            if (!contactPhone.trim()) {
              alert("請輸入手機號碼以繼續");
              return;
            }

            const bookingInfo = bookingData.data;
            const paymentData = {
              prime: result.card.prime,
              order: {
                price: bookingInfo.price,
                trip: {
                  attraction: {
                    id: bookingInfo.attraction.id,
                    name: bookingInfo.attraction.name,
                    address: bookingInfo.attraction.address,
                    image: bookingInfo.attraction.image,
                  },
                  date: bookingInfo.date,
                  time: bookingInfo.time,
                },
                contact: {
                  name: sessionStorage.getItem("userData")
                    ? JSON.parse(sessionStorage.getItem("userData")).name
                    : "",
                  email: sessionStorage.getItem("userData")
                    ? JSON.parse(sessionStorage.getItem("userData")).email
                    : "",
                  phone: contactPhone,
                },
              },
            };

            // Send booking data to the order API
            fetch("/api/orders", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(paymentData),
            })
              .then((response) => response.json())
              .then((orderResponse) => {
                if (orderResponse.error) {
                  alert("Error processing payment: " + orderResponse.message);
                } else {
                  window.location.href = `/thankyou?number=${orderResponse.data.number}`;
                }
              })
              .catch((error) => {
                console.error("Error processing payment:", error);
                alert("付款失敗，請再試一次");
              });
          });
        })
        .catch((error) => {
          console.error("Error fetching booking info:", error);
          alert("無法取得預定資料，請再次預定");
        });
    });
  })
  .catch((error) => console.error("Error fetching config:", error));

function setNumberFormGroupToError(selector) {
  $(selector).addClass("has-error");
  $(selector).removeClass("has-success");
}

function setNumberFormGroupToSuccess(selector) {
  $(selector).removeClass("has-error");
  $(selector).addClass("has-success");
}

function setNumberFormGroupToNormal(selector) {
  $(selector).removeClass("has-error");
  $(selector).removeClass("has-success");
}

function forceBlurIos() {
  if (!isIos()) {
    return;
  }
  var input = document.createElement("input");
  input.setAttribute("type", "text");
  document.activeElement.prepend(input);
  input.focus();
  input.parentNode.removeChild(input);
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
