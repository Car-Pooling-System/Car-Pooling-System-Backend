export function generateRideDates(schedule) {
  const dates = [];
  const start = new Date(schedule.departureTime);
  const end = schedule.recurrence.endDate;

  let current = new Date(start);

  while (current <= end) {
    if (schedule.recurrence.type === "daily") {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    if (
      schedule.recurrence.type === "weekly" &&
      schedule.recurrence.daysOfWeek.includes(current.getDay())
    ) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  return dates;
}
