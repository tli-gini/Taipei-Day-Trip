console.log("Homepage successful connection.");

let nextPage = 0;
let isLoading = false;
let currentKeyword = "";

const options = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const loadAttractions = async (page, keyword = "") => {
  if (isLoading || nextPage === null) return;
  isLoading = true;

  try {
    const response = await fetch(
      `${apiUrl}/api/attractions?page=${page}&keyword=${keyword}`,
      options
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);

    let result = document.querySelector("#big-boxes");

    if (page === 0) {
      result.innerHTML = "";
    }

    let spotInfo = data.data;
    spotInfo.forEach((spot) => {
      let attractionHTML = `
        <div class="big-box" data-id="${spot.id}">
          <div class="box-top">
            <img src="${spot.images[0]}" alt="${spot.name}" />
            <div class="big-text">${spot.name}</div>
          </div>
          <div class="bottom-text">
            <div class="bottom-text-left">${spot.mrt}</div>
            <div class="bottom-text-right">${spot.category}</div>
          </div>
        </div>
      `;

      result.innerHTML += attractionHTML;
    });

    nextPage = data.nextPage;
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    isLoading = false;
  }
};

loadAttractions(nextPage);

document.getElementById("search-button").addEventListener("click", () => {
  const keywordInput = document.querySelector(".search-box input");
  currentKeyword = keywordInput.value;
  nextPage = 0;
  loadAttractions(nextPage, currentKeyword);
});

document.querySelector("#big-boxes").addEventListener("click", (event) => {
  const box = event.target.closest(".big-box");
  if (box) {
    const id = box.getAttribute("data-id");
    window.location.href = `/attraction/${id}`;
  }
});

// Fetch MRT Station Names
const mrtsOptions = {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

fetch(`${apiUrl}/api/mrts`, mrtsOptions)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);

    let result = document.querySelector("#mrt-bar");
    result.innerHTML = "";

    let mrtAll = data.data;
    mrtAll.forEach((mrt) => {
      let mrtHTML = `
        <li class="mrt">
          <a href="#" data-mrt="${mrt}">${mrt}</a>
        </li>
      `;

      result.innerHTML += mrtHTML;
    });

    addMRTEventListeners();
  })
  .catch((err) => console.error(err));

const addMRTEventListeners = () => {
  document.querySelectorAll(".mrt a").forEach((mrtLink) => {
    mrtLink.addEventListener("click", (event) => {
      event.preventDefault();
      const mrtName = event.target.getAttribute("data-mrt");
      document.querySelector(".search-box input").value = mrtName;
      currentKeyword = mrtName;
      nextPage = 0;
      loadAttractions(nextPage, mrtName);
    });
  });
};

// IntersectionObserver setup
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadAttractions(nextPage, currentKeyword);
      }
    });
  },
  {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  }
);

const sentinel = document.createElement("div");
sentinel.id = "sentinel";
document.body.appendChild(sentinel);

observer.observe(sentinel);
