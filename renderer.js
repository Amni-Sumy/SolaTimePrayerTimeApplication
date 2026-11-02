// renderer.js - Page 1 (Prayer Times)
//
// What this file does:
//  1. Searches a city                 (API 1: Open-Meteo Geocoding)
//  2. Gets prayer times + Hijri date  (API 2: Aladhan)
//  3. Gets the Qibla direction        (API 3: Aladhan)
//  4. Gets the current weather        (API 4: Open-Meteo Forecast)
//  5. Gets a Quran verse              (API 5: Al-Quran Cloud)
//  6. Suggests activities (if...else), counts down to the next prayer,
//     and lets the user save a suggestion as a reminder (Local Storage)

// ---------- API addresses (all free, no API key needed) ----------
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const TIMINGS_URL = "https://api.aladhan.com/v1/timings/";
const QIBLA_URL = "https://api.aladhan.com/v1/qibla/";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AYAH_URL = "https://api.alquran.cloud/v1/ayah/";

// ---------- Page elements ----------
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const errorBox = document.getElementById("errorBox");
const statusBox = document.getElementById("statusBox");
const cityName = document.getElementById("cityName");
const dateText = document.getElementById("dateText");
const hijriText = document.getElementById("hijriText");
const weatherText = document.getElementById("weatherText");
const qiblaText = document.getElementById("qiblaText");
const timesList = document.getElementById("timesList");
const nextPrayerText = document.getElementById("nextPrayer");
const countdownText = document.getElementById("countdown");
const nightText = document.getElementById("nightText");
const suggestionList = document.getElementById("suggestionList");
const ayahArabic = document.getElementById("ayahArabic");
const ayahEnglish = document.getElementById("ayahEnglish");
const ayahRef = document.getElementById("ayahRef");
const ayahBtn = document.getElementById("ayahBtn");

// ---------- Data kept while the app is open ----------
const prayerNames = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
let prayerTimes = null;   // e.g. { Fajr: "05:50", Sunrise: "07:00", ... }
let prayerSeconds = null; // same times, but in seconds since midnight
let weather = null;       // { temp: 30, text: "Rain", group: "rain" }


// =====================================================
// Small helper functions
// =====================================================

// Add a zero in front of single digits: 5 -> "05"
function pad(number) {
  return String(number).padStart(2, "0");
}

// "05:50" -> 21000 (seconds since midnight)
function timeToSeconds(text) {
  const clean = text.split(" ")[0];      // remove extra text such as " (+08)"
  const parts = clean.split(":");
  return Number(parts[0]) * 3600 + Number(parts[1]) * 60;
}

// 3725 -> "01:02:05"
function secondsToClock(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

// 3725 -> "1 h 2 min"
function secondsToText(total) {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours + " h " + minutes + " min";
}

// Current time of this computer in seconds since midnight
function secondsNow() {
  const now = new Date();
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

// Today's date in the format the Aladhan API needs: DD-MM-YYYY
function todayForApi() {
  const now = new Date();
  return pad(now.getDate()) + "-" + pad(now.getMonth() + 1) + "-" + now.getFullYear();
}

// Fetch a URL and return the JSON data. Throws an error if the server fails.
async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Server error (code " + response.status + ")");
  }
  return await response.json();
}

// Turn the weather code from Open-Meteo into text
function describeWeather(code) {
  if (code === 0) return { text: "Clear sky", group: "clear" };
  if (code <= 3) return { text: "Cloudy", group: "cloud" };
  if (code === 45 || code === 48) return { text: "Fog", group: "fog" };
  if (code >= 51 && code <= 67) return { text: "Rain", group: "rain" };
  if (code >= 71 && code <= 77) return { text: "Snow", group: "snow" };
  if (code >= 80 && code <= 82) return { text: "Heavy rain showers", group: "rain" };
  if (code >= 95) return { text: "Thunderstorm", group: "storm" };
  return { text: "Unknown", group: "unknown" };
}


// =====================================================
// TASK 2: Calling the APIs and reading the JSON
// =====================================================

// API 2: prayer times + Hijri date
async function loadPrayerTimes(place) {
  try {
    const url = TIMINGS_URL + todayForApi() +
      "?latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&method=17" +                                  // 17 = JAKIM (Malaysia)
      "&timezonestring=" + encodeURIComponent(place.timezone);
    const json = await getJson(url);

    // Read the data we need from the JSON
    const timings = json.data.timings;
    prayerTimes = {};
    prayerSeconds = {};
    for (const name of prayerNames) {
      prayerTimes[name] = timings[name].split(" ")[0];
      prayerSeconds[name] = timeToSeconds(timings[name]);
    }

    const hijri = json.data.date.hijri;
    hijriText.textContent = hijri.day + " " + hijri.month.en + " " + hijri.year + " H";
    showPrayerTimes();
    showNightInfo();
  } catch (error) {
    prayerTimes = null;
    prayerSeconds = null;
    timesList.innerHTML = "";
    hijriText.textContent = "-";
    errorBox.textContent = "Could not load prayer times: " + error.message;
  }
}

// API 3: Qibla direction (in degrees from North)
async function loadQibla(place) {
  try {
    const json = await getJson(QIBLA_URL + place.latitude + "/" + place.longitude);
    qiblaText.textContent = json.data.direction.toFixed(2) + " degrees from North";
  } catch (error) {
    qiblaText.textContent = "Not available";
  }
}

// API 4: current weather
async function loadWeather(place) {
  try {
    const url = WEATHER_URL +
      "?latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,weather_code";
    const json = await getJson(url);

    const info = describeWeather(json.current.weather_code);
    weather = { temp: json.current.temperature_2m, text: info.text, group: info.group };
    weatherText.textContent = info.text + ", " + weather.temp + " °C";
  } catch (error) {
    weather = null;
    weatherText.textContent = "Not available";
  }
}

// API 5: a random Quran verse (Arabic + English translation)
async function loadAyah() {
  try {
    const number = Math.floor(Math.random() * 6236) + 1;   // verses 1 to 6236
    const json = await getJson(AYAH_URL + number + "/editions/quran-uthmani,en.sahih");

    ayahArabic.textContent = json.data[0].text;
    ayahEnglish.textContent = json.data[1].text;
    ayahRef.textContent = "Surah " + json.data[0].surah.englishName +
      ", verse " + json.data[0].numberInSurah;
  } catch (error) {
    ayahEnglish.textContent = "Could not load a verse: " + error.message;
  }
}


// =====================================================
// Search a city, then load everything
// =====================================================

async function searchCity() {
  const city = cityInput.value.trim();
  errorBox.textContent = "";
  errorBox.className = "message";

  // Check the input first (invalid input)
  if (city === "") {
    showMessage("errorBox", "Please enter a city name.", true);
    return;
  }
  if (city.length < 2) {
    showMessage("errorBox", "City name is too short (minimum 2 letters).", true);
    return;
  }

  statusBox.textContent = "Loading...";
  try {
    const url = GEOCODING_URL + "?name=" + encodeURIComponent(city) + "&count=1";
    const json = await getJson(url);

    // If no city is found, the API does not send "results"
    if (!json.results || json.results.length === 0) {
      showMessage("errorBox", 'No city found for "' + city + '". Try another spelling.', true);
      statusBox.textContent = "";
      return;
    }

    const place = json.results[0];
    cityName.textContent = place.name + ", " + place.country;
    dateText.textContent = new Date().toDateString();

    await loadPrayerTimes(place);
    await loadQibla(place);
    await loadWeather(place);
    showSuggestions();
    statusBox.textContent = "";
  } catch (error) {
    statusBox.textContent = "";
    showMessage("errorBox", "Could not search the city: " + error.message +
      ". Please check your internet connection.", true);
  }
}


// =====================================================
// Showing the prayer times
// =====================================================

function showPrayerTimes() {
  timesList.innerHTML = "";
  const next = findNextPrayer();

  for (const name of prayerNames) {
    const li = document.createElement("li");
    li.innerHTML = "<span>" + name + "</span><span>" + prayerTimes[name] + "</span>";
    if (name === next.name) {
      li.className = "next";   // highlight the next prayer
    }
    timesList.appendChild(li);
  }
}


// =====================================================
// TASK 4: Calculations
// =====================================================

// Find the next prayer and how many seconds are left.
function findNextPrayer() {
  const now = secondsNow();
  const fivePrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  for (const name of fivePrayers) {
    if (prayerSeconds[name] > now) {
      return { name: name, remaining: prayerSeconds[name] - now };
    }
  }

  // All prayers today are finished -> next one is Fajr tomorrow
  // (24 hours = 86400 seconds)
  return { name: "Fajr (tomorrow)", remaining: prayerSeconds.Fajr + 86400 - now };
}

// Called every second to update the countdown
function updateCountdown() {
  if (prayerSeconds === null) {
    nextPrayerText.textContent = "-";
    countdownText.textContent = "--:--:--";
    return;
  }
  const next = findNextPrayer();
  nextPrayerText.textContent = next.name;
  countdownText.textContent = secondsToClock(next.remaining);
}

// Night calculation: the night is from Maghrib until Fajr (next day).
// The last third of the night is the best time for Tahajud.
function showNightInfo() {
  const nightLength = prayerSeconds.Fajr + 86400 - prayerSeconds.Maghrib;
  const lastThirdStart = prayerSeconds.Fajr + 86400 - nightLength / 3;

  // Use % 86400 so that times after midnight are shown correctly
  const startText = secondsToClock(Math.round(lastThirdStart) % 86400).slice(0, 5);
  nightText.textContent = "Night length: " + secondsToText(nightLength) +
    ". The last third of the night starts at " + startText + " (time for Tahajud).";
}


// =====================================================
// TASK 3: Suggestion logic (if...else)
// =====================================================

// Returns a list of suggestions. Each one has: title, detail, prayer.
function getSuggestions() {
  const list = [];

  // If prayer times are not loaded, we cannot suggest anything
  if (prayerSeconds === null) {
    return list;
  }

  const now = secondsNow();
  const t = prayerSeconds;
  const day = new Date().getDay();   // 0 = Sunday ... 6 = Saturday

  // Where is the last third of the night? (after midnight, before Fajr)
  const nightLength = t.Fajr + 86400 - t.Maghrib;
  const lastThirdStart = (t.Fajr + 86400 - nightLength / 3) % 86400;

  // ----- Part 1: suggestions based on the time of day -----
  if (now < t.Fajr && now >= lastThirdStart) {
    list.push({ title: "Tahajud prayer", detail: "It is the last third of the night. A great time to pray and ask for forgiveness.", prayer: "Fajr" });
  } else if (now < t.Fajr) {
    list.push({ title: "Rest before Fajr", detail: "Get enough sleep so that it is easy to wake up for Fajr.", prayer: "Fajr" });
  } else if (now < t.Sunrise) {
    list.push({ title: "Morning dhikr", detail: "Remember Allah after Fajr until the sun rises.", prayer: "Fajr" });
  } else if (now < t.Sunrise + 15 * 60) {
    list.push({ title: "Wait for Dhuha time", detail: "Do not pray sunnah for about 15 minutes after sunrise.", prayer: "Sunrise" });
  } else if (now < t.Dhuhr) {
    list.push({ title: "Dhuha prayer", detail: "Pray 2 to 8 rakaat before Dhuhr time.", prayer: "Sunrise" });
  } else if (now < t.Asr) {
    list.push({ title: "Sunnah prayer after Dhuhr", detail: "Pray the sunnah and then read dhikr.", prayer: "Dhuhr" });
  } else if (now < t.Maghrib) {
    list.push({ title: "Evening dhikr", detail: "Read the evening dhikr and send salawat on the Prophet.", prayer: "Asr" });
  } else if (now < t.Isha) {
    list.push({ title: "Read the Quran", detail: "Between Maghrib and Isha is a good time to read the Quran.", prayer: "Maghrib" });
  } else {
    list.push({ title: "Witir prayer", detail: "Pray the sunnah of Isha and Witir before you sleep.", prayer: "Isha" });
  }

  // ----- Part 2: suggestions based on the day of the week -----
  if (day === 5) {
    list.push({ title: "Read Surah Al-Kahf", detail: "It is Friday. Read Surah Al-Kahf and send more salawat.", prayer: "Anytime" });
  } else if ((day === 1 || day === 4) && now < t.Dhuhr) {
    list.push({ title: "Sunnah fasting", detail: "It is Monday or Thursday. You can still make the intention to fast before Dhuhr.", prayer: "Fajr" });
  }

  // ----- Part 3: suggestions based on the weather -----
  if (weather !== null) {
    if (weather.group === "storm") {
      list.push({ title: "Thunderstorm: be careful", detail: "Avoid open areas. Pray at home if it is not safe to go out.", prayer: "Anytime" });
    } else if (weather.group === "rain") {
      list.push({ title: "Rain: bring an umbrella", detail: "Bring an umbrella to the mosque. Making dua while it rains is encouraged.", prayer: "Anytime" });
    }
    if (weather.temp >= 33) {
      list.push({ title: "Hot weather: drink water", detail: "It is " + weather.temp + " °C. Drink enough water and make wudu to cool down.", prayer: "Anytime" });
    }
  }

  return list;
}

// Show the suggestions on the page
function showSuggestions() {
  suggestionList.innerHTML = "";
  const suggestions = getSuggestions();

  // Fallback message if there is nothing to suggest
  if (suggestions.length === 0) {
    suggestionList.textContent = "No specific suggestion right now. You can say a short dhikr: SubhanAllah, Alhamdulillah, Allahu Akbar.";
    return;
  }

  // Save the suggestions to Local Storage (they appear on the My Reminders page)
  saveSuggestionsToStorage(suggestions);

  for (const item of suggestions) {
    const box = document.createElement("div");
    box.className = "suggestion";

    const title = document.createElement("h3");
    title.textContent = item.title;
    const detail = document.createElement("p");
    detail.textContent = item.detail;

    box.appendChild(title);
    box.appendChild(detail);
    suggestionList.appendChild(box);
  }
}


// =====================================================
// TASK 5: Store the suggestions in Local Storage
// =====================================================

// Add the suggestions that were shown to the reminders list in Local Storage.
// The My Reminders page reads this list. The same suggestion is not added twice on the same day.
function saveSuggestionsToStorage(suggestions) {
  const reminders = loadReminders();
  const today = todayForApi();
  let changed = false;

  for (const item of suggestions) {
    let exists = false;
    for (const r of reminders) {
      if (r.source === "suggestion" && r.title === item.title && r.prayer === item.prayer && r.date === today) {
        exists = true;
      }
    }
    if (exists === false) {
      reminders.push({
        id: Date.now() + reminders.length,   // a unique number
        title: item.title,
        prayer: item.prayer,
        note: item.detail,
        done: false,
        source: "suggestion",
        date: today
      });
      changed = true;
    }
  }

  if (changed) {
    saveReminders(reminders);
  }
}


// =====================================================
// Start the app
// =====================================================

searchBtn.addEventListener("click", searchCity);
ayahBtn.addEventListener("click", loadAyah);

// Press Enter in the input box = click Search
cityInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    searchCity();
  }
});

// Update the countdown and suggestions
setInterval(updateCountdown, 1000);
setInterval(function () {
  if (prayerSeconds !== null) {
    showPrayerTimes();
    showSuggestions();
  }
}, 60000);   // every 1 minute

loadAyah();
searchCity();   // load the default city (Klang) when the app opens
