function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function getRestaurantOpenState(openingTime: string, closingTime: string) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const opens = minutesFromTime(openingTime);
  const closes = minutesFromTime(closingTime);

  if (opens === closes) return { open: true, label: "Open now" };

  const open =
    opens < closes
      ? current >= opens && current <= closes
      : current >= opens || current <= closes;

  return { open, label: open ? "Open now" : "Closed now" };
}
