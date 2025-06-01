const express = require('express');
const ical = require('ical-generator');

const app = express();
const port = process.env.PORT || 3000;

app.get('/calendar.ics', (req, res) => {
  const calendar = ical({ name: 'My Calendar' });

  calendar.createEvent({
    start: new Date(),
    end: new Date(new Date().getTime() + 60 * 60 * 1000),
    summary: 'Sample Event',
    description: 'This is a sample event.',
    location: 'Online',
  });

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline');
  res.send(calendar.toString());
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
