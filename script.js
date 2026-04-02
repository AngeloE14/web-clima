const GEO_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const LAST_CITY_KEY = "weather:last-city";
const THEME_KEY = "weather:theme";

const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const clearButton = document.getElementById("clearButton");
const loadingMessage = document.getElementById("loadingMessage");
const errorMessage = document.getElementById("errorMessage");
const weatherResult = document.getElementById("weatherResult");
const cityName = document.getElementById("cityName");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const realFeel = document.getElementById("realFeel");
const humidity = document.getElementById("humidity");
const weatherStatus = document.getElementById("weatherStatus");
const themeToggle = document.getElementById("themeToggle");
const themeToggleIcon = themeToggle.querySelector(".theme-toggle__icon");

const WEATHER_CODES = {
  0: { text: "Despejado", icon: "☀️", effect: "clear" },
  1: { text: "Mayormente despejado", icon: "🌤️", effect: "clear" },
  2: { text: "Parcialmente nublado", icon: "⛅", effect: "cloudy" },
  3: { text: "Nublado", icon: "☁️", effect: "cloudy" },
  45: { text: "Niebla", icon: "🌫️", effect: "cloudy" },
  48: { text: "Niebla con escarcha", icon: "🌫️", effect: "cloudy" },
  51: { text: "Llovizna ligera", icon: "🌦️", effect: "rain" },
  53: { text: "Llovizna moderada", icon: "🌦️", effect: "rain" },
  55: { text: "Llovizna intensa", icon: "🌧️", effect: "rain" },
  56: { text: "Llovizna helada ligera", icon: "🌨️", effect: "rain" },
  57: { text: "Llovizna helada intensa", icon: "🌨️", effect: "rain" },
  61: { text: "Lluvia ligera", icon: "🌦️", effect: "rain" },
  63: { text: "Lluvia moderada", icon: "🌧️", effect: "rain" },
  65: { text: "Lluvia intensa", icon: "🌧️", effect: "rain" },
  66: { text: "Lluvia helada ligera", icon: "🌨️", effect: "rain" },
  67: { text: "Lluvia helada intensa", icon: "🌨️", effect: "rain" },
  71: { text: "Nieve ligera", icon: "🌨️", effect: "cloudy" },
  73: { text: "Nieve moderada", icon: "❄️", effect: "cloudy" },
  75: { text: "Nieve intensa", icon: "❄️", effect: "cloudy" },
  77: { text: "Granos de nieve", icon: "🌨️", effect: "cloudy" },
  80: { text: "Chubascos ligeros", icon: "🌦️", effect: "rain" },
  81: { text: "Chubascos moderados", icon: "🌧️", effect: "rain" },
  82: { text: "Chubascos violentos", icon: "⛈️", effect: "rain" },
  85: { text: "Nevadas ligeras", icon: "🌨️", effect: "cloudy" },
  86: { text: "Nevadas intensas", icon: "❄️", effect: "cloudy" },
  95: { text: "Tormenta", icon: "⛈️", effect: "rain" },
  96: { text: "Tormenta con granizo ligero", icon: "⛈️", effect: "rain" },
  99: { text: "Tormenta con granizo intenso", icon: "⛈️", effect: "rain" }
};

// Sincroniza los controles mientras se consulta la API.
function setLoading(isLoading) {
  loadingMessage.classList.toggle("hidden", !isLoading);
  searchButton.disabled = isLoading;
  clearButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Buscando..." : "Buscar";
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

function updateWeatherEffect(effect) {
  document.body.classList.remove(
    "weather-effect-rain",
    "weather-effect-clear",
    "weather-effect-cloudy"
  );

  if (effect === "rain") {
    document.body.classList.add("weather-effect-rain");
    return;
  }

  if (effect === "clear") {
    document.body.classList.add("weather-effect-clear");
    return;
  }

  document.body.classList.add("weather-effect-cloudy");
}

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || {
    text: "Condición no disponible",
    icon: "🌍",
    effect: "cloudy"
  };
}

function createIconDataUrl(emoji) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="28" fill="rgba(255,255,255,0)" />
      <text x="50%" y="55%" font-size="72" text-anchor="middle" dominant-baseline="middle">
        ${emoji}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderWeather(city, current) {
  const temperatureValue = Math.round(current.temperature_2m);
  const realFeelValue = Math.round(current.apparent_temperature);
  const humidityValue = current.relative_humidity_2m ?? "N/D";
  const humidityText =
    typeof humidityValue === "number" ? `${humidityValue}%` : humidityValue;
  const weatherInfo = getWeatherInfo(current.weather_code);
  const description = weatherInfo.text;
  const locationParts = [city.name, city.admin1, city.country].filter(Boolean);

  cityName.textContent = locationParts.join(", ");
  weatherDescription.textContent = description;
  weatherStatus.textContent = description;
  temperature.textContent = `${temperatureValue}°C`;
  realFeel.textContent = `${realFeelValue}°C`;
  humidity.textContent = humidityText;
  weatherIcon.src = createIconDataUrl(weatherInfo.icon);
  weatherIcon.alt = `Icono del clima: ${description}`;

  weatherResult.classList.remove("hidden");
  updateWeatherEffect(weatherInfo.effect);
}

// Busca la ciudad y devuelve sus coordenadas.
async function getCityLocation(city) {
  const endpoint = `${GEO_BASE_URL}?name=${encodeURIComponent(
    city
  )}&count=1&language=es&format=json`;

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("No fue posible buscar la ciudad.");
  }

  const locations = await response.json();

  if (!Array.isArray(locations.results) || locations.results.length === 0) {
    throw new Error("La ciudad no existe o no se encontró.");
  }

  return locations.results[0];
}

// Con las coordenadas obtiene el clima actual detallado.
async function getCurrentConditions(latitude, longitude) {
  const endpoint = `${WEATHER_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&timezone=auto`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("No fue posible obtener las condiciones actuales.");
  }

  const conditions = await response.json();

  if (!conditions.current) {
    throw new Error("No hay datos meteorológicos disponibles para esta ciudad.");
  }

  return conditions.current;
}

// Punto central de la búsqueda: valida, consulta y pinta la interfaz.
async function searchWeather(city) {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    showError("Escribe una ciudad antes de buscar.");
    weatherResult.classList.add("hidden");
    return;
  }

  clearError();
  setLoading(true);

  try {
    const cityData = await getCityLocation(trimmedCity);
    const currentData = await getCurrentConditions(
      cityData.latitude,
      cityData.longitude
    );

    renderWeather(cityData, currentData);
    localStorage.setItem(LAST_CITY_KEY, cityData.name);
  } catch (error) {
    weatherResult.classList.add("hidden");
    showError(error.message || "Ocurrió un error inesperado.");
  } finally {
    setLoading(false);
  }
}

function clearSearch() {
  cityInput.value = "";
  weatherResult.classList.add("hidden");
  clearError();
  loadingMessage.classList.add("hidden");
  localStorage.removeItem(LAST_CITY_KEY);
  document.body.classList.remove(
    "weather-effect-rain",
    "weather-effect-clear",
    "weather-effect-cloudy"
  );
  cityInput.focus();
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

// Recupera el tema guardado o usa la preferencia del sistema.
function loadSavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme) {
    applyTheme(savedTheme);
    return;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await searchWeather(cityInput.value);
});

clearButton.addEventListener("click", clearSearch);

themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(nextTheme);
});

window.addEventListener("DOMContentLoaded", async () => {
  loadSavedTheme();

  const lastCity = localStorage.getItem(LAST_CITY_KEY);
  if (lastCity) {
    cityInput.value = lastCity;
    await searchWeather(lastCity);
  }
});
