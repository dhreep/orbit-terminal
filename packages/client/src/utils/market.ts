export function getNYSEStatus(): { isOpen: boolean; label: string } {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const timeInMinutes = et.getHours() * 60 + et.getMinutes();
  const isOpen = day >= 1 && day <= 5 && timeInMinutes >= 570 && timeInMinutes < 960;
  return { isOpen, label: isOpen ? 'OPEN' : 'CLOSED' };
}
