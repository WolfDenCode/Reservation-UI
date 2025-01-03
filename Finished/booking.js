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

//#region Main Calculations
function updateCalendar() {
  calendar.innerHTML = "";

  const firstDay = new Date(Date.UTC(currentYear, currentMonth, 1));
  const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0));
  const daysInMonth = lastDay.getUTCDate();

  currentMonthYear.textContent = `${firstDay.toLocaleString("default", {
    month: "long",
  })} ${currentYear}`;

  prevMonthBtn.disabled =
    currentYear == today.getUTCFullYear() &&
    currentMonth == today.getUTCMonth();

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement("div");

    dayDiv.className = "day";

    const span = document.createElement("span");
    span.textContent = i;

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(i).padStart(2, "0")}`;
    dayDiv.dataset.date = dateStr;

    dayDiv.appendChild(span);

    //If the date have already passed then disable those tiles
    const dayDate = new Date(`${dateStr}T00:00:00Z`);
    if (dayDate < today) {
      dayDiv.classList.add("disabled");
    }
    if (startDate && !endDate && dayDate < startDate) {
      dayDiv.classList.add("disabled");
    }

    dayDiv.addEventListener("click", () => handleDateSelection(dayDiv));
    calendar.appendChild(dayDiv);
  }

  highlightOccupiedDates(occupiedDates, currentMonth, currentYear, lastDay);
  disableFullyOccupiedTiles();
  persistUserSelection(startDate, endDate, currentMonth, currentYear, lastDay);
}
function handleDateSelection(dayDiv) {
  const selectedDate = new Date(`${dayDiv.dataset.date}T00:00:00Z`);

  if (selectingStart) {
    if (occupiedDates.find((x) => x.startDate == normalizeDate(selectedDate))) {
      alert("Arrival date is already booked");
      return;
    }
    startDate = selectedDate;
    endDate = null; // Reset end date
    clearSelection();
    updateCalendar();
    selectingStart = false;
  } else {
    if (selectedDate <= startDate) {
      alert("End date must be after the start date.");
      return;
    }
    // check if selection is overlapping

    const noOverlaps = occupiedDates.every((occupiedDate) => {
      const isOverlapping =
        (normalizeDate(startDate) > occupiedDate.startDate &&
          normalizeDate(startDate) < occupiedDate.endDate) ||
        (occupiedDate.startDate > normalizeDate(startDate) &&
          occupiedDate.startDate < normalizeDate(selectedDate));
      return !isOverlapping;
    });
    if (!noOverlaps) {
      alert("You are trying to book already booked dates.");
      return;
    }
    endDate = selectedDate;
    selectingStart = true;
  }
  updateCalendar();
}

function calculateHighlightRange(
  occupation,
  currentMonth,
  currentYear,
  lastDay
) {
  const startingDate = new Date(`${occupation.startDate}T00:00:00Z`);
  const endingDate = new Date(`${occupation.endDate}T00:00:00Z`);

  if (
    startingDate.getUTCMonth() !== currentMonth ||
    startingDate.getUTCFullYear() !== currentYear
  ) {
    let d = new Date(startingDate);
    let monthStartDate = null;
    while (!monthStartDate && d <= endingDate) {
      if (
        d.getUTCMonth() === currentMonth &&
        d.getUTCFullYear() === currentYear
      ) {
        monthStartDate = new Date(d);
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }

    if (
      endingDate.getUTCMonth() > currentMonth ||
      endingDate.getUTCFullYear() > currentYear
    ) {
      return { start: monthStartDate, end: lastDay };
    } else {
      return { start: monthStartDate, end: endingDate };
    }
  } else {
    return { start: startingDate, end: endingDate };
  }
}

function highlightOccupiedDates(
  occupiedDates,
  currentMonth,
  currentYear,
  lastDay
) {
  occupiedDates.forEach((occupation) => {
    const { start, end } = calculateHighlightRange(
      occupation,
      currentMonth,
      currentYear,
      lastDay
    );
    if (!start || !end) return;

    const displayFullStart = normalizeDate(start) > occupation.startDate;
    const displayFullEnd = normalizeDate(end) < occupation.endDate;

    if (displayFullStart && displayFullEnd) {
      highlightRange(start, end, false, false);
    } else if (displayFullStart) {
      highlightRange(start, end, false, true);
    } else if (displayFullEnd) {
      highlightRange(start, end, true, false);
    } else {
      highlightRange(start, end);
    }
  });
}

function persistUserSelection(
  startDate,
  endDate,
  currentMonth,
  currentYear,
  lastDay
) {
  if (startDate && endDate) {
    const { start, end } = calculateHighlightRange(
      {
        startDate: normalizeDate(startDate),
        endDate: normalizeDate(endDate),
      },
      currentMonth,
      currentYear,
      lastDay
    );

    if (!start || !end) return;

    const displayFullStart = normalizeDate(start) > normalizeDate(startDate);
    const displayFullEnd = normalizeDate(end) < normalizeDate(endDate);

    if (displayFullStart && displayFullEnd) {
      highlightRange(start, end, false, false);
    } else if (displayFullStart) {
      highlightRange(start, end, false, true);
    } else if (displayFullEnd) {
      highlightRange(start, end, true, false);
    } else {
      highlightRange(start, end);
    }
  } else if (
    startDate &&
    !endDate &&
    startDate.getUTCMonth() == currentMonth &&
    startDate.getUTCFullYear() == currentYear
  ) {
    highlightRange(startDate, null); // Only highlight the start date
  }
}

function highlightRange(
  startDate,
  endDate,
  startTriangle = true,
  endTriangle = true
) {
  if (!startDate) return;

  const allDays = document.querySelectorAll(".day");
  allDays.forEach((day) => {
    const dayDate = new Date(`${day.dataset.date}T00:00:00Z`);

    if (normalizeDate(startDate) === normalizeDate(dayDate) && !endDate) {
      day.classList.add("afternoon");
      return;
    }
    if (
      endDate &&
      normalizeDate(dayDate) >= normalizeDate(startDate) &&
      normalizeDate(dayDate) <= normalizeDate(endDate)
    ) {
      if (
        normalizeDate(dayDate) === normalizeDate(startDate) &&
        startTriangle
      ) {
        day.classList.add("afternoon");
      } else if (
        normalizeDate(dayDate) === normalizeDate(endDate) &&
        endTriangle
      ) {
        day.classList.add("morning");
      } else {
        day.classList.add("full");
      }
    }
  });
}
//#endregion

//#region EventListeners
prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendar();
});

updateCalendar();
//#endregion

//#endregion

//#region Modal Logic

//#region Starting Variables
const dialog = document.getElementById("bookingDialog");
const openModalBtn = document.querySelector(".open-modal-btn");
const closeDialogBtn = document.getElementById("closeDialog");
const submitBookingBtn = document.querySelector("dialog .submit-btn");
let scrollTop = 0;
//#endregion

//#region Helper Functions
function disableScroll() {
  // Get the current scroll position
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // Disable scrolling by setting window.onscroll to a function that keeps the scroll position fixed
  window.onscroll = function () {
    window.scrollTo(0, scrollTop);
  };
}

function enableScroll() {
  // Re-enable scrolling by resetting window.onscroll
  window.onscroll = null;
}
function nightsBetweenDates(date1, date2) {
  // Convert dates to UTC timestamps
  let utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  let utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  // Calculate the time difference in milliseconds
  let timeDiff = Math.abs(utc2 - utc1);

  // Convert milliseconds to days
  let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return daysDiff;
}
//#endregion

//#region Event Listeners
openModalBtn.addEventListener("click", () => {
  if (!startDate && !endDate) {
    alert("Please Select the arrival and departure");
    return;
  }
  disableScroll();
  const dateRange = (document.querySelector(
    ".modal-content .date-price .dates"
  ).innerHTML = `${normalizeDate(startDate)} - ${normalizeDate(endDate)}`);
  document.querySelector(
    ".modal-content .date-price .price"
  ).innerHTML = `${350}/Night`;

  let nights = nightsBetweenDates(startDate, endDate);
  document.querySelector(".price-summary .total span").innerHTML = `${
    nights * 350
  }$`;
  document.querySelector(".price-summary .nights span").innerHTML = nights;

  dialog.showModal();
  dialog.classList.add("hide");
  setTimeout(() => {
    dialog.classList.remove("hide");
    dialog.classList.add("show");
  }, 10);
});

closeDialogBtn.addEventListener("click", () => {
  dialog.classList.remove("show");
  dialog.classList.add("hide");
  setTimeout(() => {
    dialog.close();
    enableScroll();
  }, 300); // Match the transition duration
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    closeDialogBtn.click();
  }
});

submitBookingBtn.addEventListener("click", (e) => {
  e.preventDefault();
  occupiedDates.push({
    startDate: normalizeDate(startDate),
    endDate: normalizeDate(endDate),
  });
  console.log(occupiedDates);
  startDate = null;
  endDate = null;
  closeDialogBtn.click();
  updateCalendar();
});
//#endregion

//#endregion
