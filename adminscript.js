import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5iFrQ4uprmeVeJCyKMiTDXk2T_k1sv4I",
  authDomain: "ltc-website-8a884.firebaseapp.com",
  projectId: "ltc-website-8a884",
  storageBucket: "ltc-website-8a884.firebasestorage.app",
  messagingSenderId: "1059988013295",
  appId: "1:1059988013295:web:505d59225c70675247db1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventsCol = collection(db, "events");

const form = document.getElementById("event-form");
const upcomingContainer = document.getElementById("upcoming-container");
const pastContainer = document.getElementById("past-container");

// Формат даты "July 17, 2025"
function formatDateLong(dateString) {
  try {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch {
    return dateString;
  }
}

// Функция получения локальной даты в формате YYYY-MM-DD (чтобы избежать смещения)
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const recurrence = document.getElementById("recurrence").value;

  const hourStart = document.getElementById("hourStart").value.padStart(2, "0");
  const minuteStart = document.getElementById("minuteStart").value.padStart(2, "0");
  const hourEnd = document.getElementById("hourEnd").value.padStart(2, "0");
  const minuteEnd = document.getElementById("minuteEnd").value.padStart(2, "0");

  const date = document.getElementById("date").value;
  const repeatStart = document.getElementById("repeat-start").value;
  const repeatEnd = document.getElementById("repeat-end").value;

  if (!title) {
    alert("Please enter event title");
    return;
  }

  const dummyDate = date || repeatStart || new Date().toISOString().slice(0, 10);
  const startDateTime = new Date(`${dummyDate}T${hourStart}:${minuteStart}:00`);
  const endDateTime = new Date(`${dummyDate}T${hourEnd}:${minuteEnd}:00`);

  if (endDateTime <= startDateTime) {
    alert("End time must be after start time.");
    return;
  }

  if (recurrence === "weekly") {
    if (!repeatStart || !repeatEnd) {
      alert("Please fill in repeat start and end dates.");
      return;
    }

    const startDate = new Date(repeatStart);
    const endDate = new Date(repeatEnd);
    if (endDate < startDate) {
      alert("Repeat end date must be after start date.");
      return;
    }

    const days = Array.from(document.querySelectorAll(".repeat-day:checked")).map(cb => parseInt(cb.value));
    if (days.length === 0) {
      alert("Please select at least one day of the week for recurrence.");
      return;
    }

    let current = new Date(startDate);
    while (current <= endDate) {
      if (days.includes(current.getDay())) {
        const isoDate = getLocalDateString(current);
        const startISO = `${isoDate}T${hourStart}:${minuteStart}:00`;
        const endISO = `${isoDate}T${hourEnd}:${minuteEnd}:00`;

        await addDoc(eventsCol, {
          title,
          start: startISO,
          end: endISO,
          recurrence: {
            weekly: true,
            days,
            repeatStart,
            repeatEnd
          }
        });
      }
      current.setDate(current.getDate() + 1);
    }
  } else {
    if (!date) {
      alert("Please select a date.");
      return;
    }

    await addDoc(eventsCol, {
      title,
      start: `${date}T${hourStart}:${minuteStart}:00`,
      end: `${date}T${hourEnd}:${minuteEnd}:00`,
      recurrence: null
    });
  }

  form.reset();
  document.getElementById("repeat-options").style.display = "none";
  loadEvents();
});

async function loadEvents() {
  upcomingContainer.innerHTML = "Loading upcoming events...";
  pastContainer.innerHTML = "Loading past events...";

  try {
    const snapshot = await getDocs(eventsCol);
    if (snapshot.empty) {
      upcomingContainer.textContent = "No upcoming events.";
      pastContainer.textContent = "No past events.";
      return;
    }

    const now = new Date();

    const events = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // Сортировка по дате старта
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Делим события на будущие и прошедшие
    const upcomingEvents = events.filter(ev => new Date(ev.start) >= now);
    const pastEvents = events.filter(ev => new Date(ev.start) < now);

    // Отрисовка
    function renderEvents(container, eventsArray) {
      container.innerHTML = "";
      if (eventsArray.length === 0) {
        container.textContent = "No events.";
        return;
      }
      eventsArray.forEach(event => {
        const div = document.createElement("div");
        div.className = "event-item";
        div.style.borderBottom = "1px solid #ccc";
        div.style.padding = "1rem 0";

        const startDateFormatted = formatDateLong(event.start);
        const startTime = new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const endTime = event.end ? new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

        div.innerHTML = `
          <strong>${event.title}</strong><br/>
          ${startDateFormatted} ${startTime}${endTime ? " - " + endTime : ""}<br/>
          <button data-id="${event.id}">Delete</button>
        `;

        div.querySelector("button").addEventListener("click", async () => {
          await deleteDoc(doc(eventsCol, event.id));
          loadEvents();
        });

        container.appendChild(div);
      });
    }

    renderEvents(upcomingContainer, upcomingEvents);
    renderEvents(pastContainer, pastEvents);

  } catch (error) {
    upcomingContainer.textContent = "Error loading events.";
    pastContainer.textContent = "Error loading events.";
    console.error("Error loading events:", error);
  }
}

loadEvents();

const deleteAllBtn = document.getElementById("delete-all");
deleteAllBtn.addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete all events? This action cannot be undone.")) return;

  const snapshot = await getDocs(eventsCol);
  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(eventsCol, docSnap.id)));
  await Promise.all(deletePromises);

  alert("All events deleted!");
  loadEvents();
});
