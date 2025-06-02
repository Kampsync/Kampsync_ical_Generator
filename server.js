const ical = require('ical-generator');
const http = require('http');

const calendar = ical({ name: 'My Calendar' });

calendar.createEvent({
  start: new Date(),
  end: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
  summary: 'Sample Event',
  description: 'This is a sample event.',
  location: 'Online',
  url: 'http://example.com/',
});

http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="calendar.ics"',
  });
  res.end(calendar.toString());
}).listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
