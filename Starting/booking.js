//#region Landing Toggle
const calendarContainer = document.querySelector(".calendar-container");
document.querySelector(".cta button").addEventListener("click", () => {
  calendarContainer.classList.toggle("hidden");
  document.querySelector(".cta").classList.toggle("hidden");
});
//#endregion

//#region Booking & Calendar Logic

//#region Starting Variables
const calendar = document.querySelector(".calendar");
const currentMonthYear = document.getElementById("currentMonthYear");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

let today = new Date(
  Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  )
);
let currentMonth = today.getUTCMonth();
let currentYear = today.getUTCFullYear();

let selectingStart = true;
let startDate = null;
let endDate = null;
//#endregion

//#region Predefined Dates -> Integrate DB Here
const occupiedDates = [
  { startDate: "2024-12-10", endDate: "2024-12-15" },
  { startDate: "2024-12-03", endDate: "2024-12-04" },
  { startDate: "2024-12-08", endDate: "2024-12-10" },
  { startDate: "2024-12-29", endDate: "2025-01-03" },
  { startDate: "2025-03-01", endDate: "2025-05-02" },
];
occupiedDates.sort((a, b) => {
  return (
    new Date(`${a.startDate}T00:00:00Z`) - new Date(`${b.startDate}T00:00:00Z`)
  );
});
//#endregion

//#region Helper Functions
function normalizeDate(date) {
  return date.toISOString().split("T")[0]; // Get YYYY-MM-DD format
}

function clearSelection() {
  document.querySelectorAll(".day").forEach((day) => {
    day.classList.remove("afternoon", "morning", "full", "disabled");
  });
}

function disableFullyOccupiedTiles() {
  document.querySelectorAll(".day").forEach((day) => {
    if (
      day.classList.contains("full") ||
      (day.classList.contains("morning") && day.classList.contains("afternoon"))
    ) {
      day.classList.add("disabled");
    }
  });
}
//#endregion

//#endregion
