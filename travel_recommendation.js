const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const resetButton = document.getElementById("reset-button");
const resultsContainer = document.getElementById("results-container");

let travelData = null;
const placeTimeZones = {
  "Sydney, Australia": "Australia/Sydney",
  "Melbourne, Australia": "Australia/Melbourne",
  "Tokyo, Japan": "Asia/Tokyo",
  "Kyoto, Japan": "Asia/Tokyo",
  "Rio de Janeiro, Brazil": "America/Sao_Paulo",
  "Sao Paulo, Brazil": "America/Sao_Paulo"
};

function normalizeText(value) {
  return value.toLowerCase().trim();
}

function matchesCategory(query, singular, plural) {
  return query === singular || query === plural;
}

function getCountryRecommendations() {
  return travelData.countries.flatMap((country) => country.cities);
}

function createCard(item) {
  const timeZone = placeTimeZones[item.name];
  const localTime = timeZone
    ? new Date().toLocaleTimeString("en-US", {
        timeZone,
        hour12: true,
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      })
    : "";

  return `
    <article class="result-card">
      <img src="${item.imageUrl}" alt="${item.name}">
      <div class="result-card-content">
        <h2>${item.name}</h2>
        <p>${item.description}</p>
        ${localTime ? `<p><strong>Local time:</strong> ${localTime}</p>` : ""}
        <button type="button">Visit</button>
      </div>
    </article>
  `;
}

function renderResults(items) {
  if (!items.length) {
    resultsContainer.className = "results-status";
    resultsContainer.textContent = "No recommendations found. Try another keyword.";
    return;
  }

  resultsContainer.className = "results-panel active";
  resultsContainer.innerHTML = `
    <h2>Search Results</h2>
    <div class="results-grid">
      ${items.map(createCard).join("")}
    </div>
  `;
}

function getMatches(keyword) {
  if (!travelData) {
    return [];
  }

  const query = normalizeText(keyword);

  if (matchesCategory(query, "beach", "beaches")) {
    return travelData.beaches;
  }

  if (matchesCategory(query, "temple", "temples")) {
    return travelData.temples;
  }

  if (matchesCategory(query, "country", "countries")) {
    return getCountryRecommendations();
  }

  const countryMatches = [];
  const templeMatches = [];
  const beachMatches = [];

  travelData.countries.forEach((country) => {
    const countryName = normalizeText(country.name);
    const cityMatches = country.cities.filter((city) => {
      const cityName = normalizeText(city.name);
      const cityDescription = normalizeText(city.description);
      return cityName.includes(query) || cityDescription.includes(query) || countryName.includes(query);
    });

    if (countryName.includes(query)) {
      countryMatches.push(...country.cities);
    } else {
      countryMatches.push(...cityMatches);
    }
  });

  travelData.temples.forEach((temple) => {
    const templeName = normalizeText(temple.name);
    const templeDescription = normalizeText(temple.description);
    if (templeName.includes(query) || templeDescription.includes(query)) {
      templeMatches.push(temple);
    }
  });

  travelData.beaches.forEach((beach) => {
    const beachName = normalizeText(beach.name);
    const beachDescription = normalizeText(beach.description);
    if (beachName.includes(query) || beachDescription.includes(query)) {
      beachMatches.push(beach);
    }
  });

  return [...countryMatches, ...templeMatches, ...beachMatches];
}

function handleSearch() {
  const keyword = searchInput.value;

  if (!normalizeText(keyword)) {
    resultsContainer.className = "results-status";
    resultsContainer.textContent = "Enter a keyword to search for travel recommendations.";
    return;
  }

  renderResults(getMatches(keyword));
}

function handleReset() {
  searchInput.value = "";
  resultsContainer.className = "results-status";
  resultsContainer.textContent = "";
}

fetch("travel_recommendation_api.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Unable to fetch recommendation data.");
    }

    return response.json();
  })
  .then((data) => {
    travelData = data;
    console.log("Travel recommendation data:", data);
  })
  .catch((error) => {
    console.error(error);
    resultsContainer.className = "results-status";
    resultsContainer.textContent = "Recommendation data could not be loaded.";
  });

searchButton.addEventListener("click", handleSearch);
resetButton.addEventListener("click", handleReset);
