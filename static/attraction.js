document.addEventListener("DOMContentLoaded", async () => {
  const attractionId = window.location.pathname.split("/").pop();
  try {
    const response = await fetch(`/api/attraction/${attractionId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.error) {
      console.log("error");
      document.getElementById("attraction-info").innerHTML = ``;
      return;
    }

    const attraction = data.data;

    // name
    document.getElementById("title-name").textContent =
      attraction.name + " - 台北一日遊";
    document.getElementById("attraction-name").textContent = attraction.name;

    // cat mrt
    document.getElementById("cat").textContent = attraction.category;
    document.getElementById("mrt").textContent = attraction.mrt;

    // description
    document.getElementById("description").textContent = attraction.description;

    // address
    document.getElementById("address").textContent = attraction.address;

    // transport
    document.getElementById("transport").textContent = attraction.transport;

    // images
    const imgWrapper = document.getElementById("img-wrapper");
    const slideNav = document.getElementById("slide-nav");

    let imgIndex = 0;
    const images = attraction.images;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imgElement = document.createElement("img");
      imgElement.src = image;
      imgElement.alt = attraction.name;
      imgElement.className = "left-img";
      imgElement.dataset.i = i;
      if (i !== 0) {
        imgElement.style.display = "none";
      }
      imgWrapper.appendChild(imgElement);

      const navDot = document.createElement("span");
      navDot.className = "img-dot";
      navDot.dataset.i = i;
      if (i === 0) {
        navDot.classList.add("active");
      }
      navDot.addEventListener("click", () => {
        showSlide(i);
      });
      slideNav.appendChild(navDot);
    }

    const showSlide = (index) => {
      const imgElements = imgWrapper.querySelectorAll(".left-img");
      const navDots = slideNav.querySelectorAll(".img-dot");
      for (let i = 0; i < imgElements.length; i++) {
        imgElements[i].style.display = i === index ? "block" : "none";
        navDots[i].classList.toggle("active", i === index);
      }
      imgIndex = index;
    };

    document.getElementById("prev-slide").addEventListener("click", () => {
      showSlide((imgIndex - 1 + images.length) % images.length);
    });

    document.getElementById("next-slide").addEventListener("click", () => {
      showSlide((imgIndex + 1) % images.length);
    });
  } catch (error) {
    console.error("Error fetching attraction details:", error);
    document.getElementById("title-name").textContent = "景點 - 台北一日遊";
    document.getElementById("attraction-info").innerHTML = `
      <div class="error">
        <div class="error-paragraph">Attraction not found</div>
        <button class="booking-btn" id="error-to-homepage">返回首頁</button>
      </div>`;
    document
      .querySelector("#error-to-homepage")
      .addEventListener("click", () => {
        window.location.href = `/`;
      });
  }
});

document.querySelector("#back-to-homepage").addEventListener("click", () => {
  window.location.href = `/`;
});
