// script.js
import { db, collection, getDocs } from './firebase.js';

// Функция загрузки событий из Firestore
async function loadEvents() {
  const eventsCol = collection(db, 'events');
  const eventsSnapshot = await getDocs(eventsCol);
  const events = [];

  eventsSnapshot.forEach(doc => {
    const data = doc.data();

    // Даты в Firestore — строки ISO, просто используем их
    const start = data.start;           // например "2025-07-19T18:00:00"
    const end = data.end || null;

    events.push({
      id: doc.id,
      title: data.title,
      start,
      end,
      rrule: data.rrule || null,       // если есть правило повторения
      allDay: false,
    });
  });

  return events;
}

document.addEventListener('DOMContentLoaded', async () => {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  height: 600,

  displayEventTime: true,   // показывать время начала
  displayEventEnd: true,    // показывать время окончания
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },

  events: async function(fetchInfo, successCallback, failureCallback) {
    try {
      const events = await loadEvents();
      successCallback(events);
    } catch (error) {
      console.error('Error loading events from Firestore:', error);
      failureCallback(error);
    }
  }
});


  calendar.render();
});