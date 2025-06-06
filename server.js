const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const app = express();

const PORT = process.env.PORT || 3000;
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

app.get('/api/calendar/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  if (!listingId || !XANO_API_BASE_URL) {
    return res.status(400).send('Missing required parameters or config');
  }

  try {
    const { data: bookings } = await axios.get(XANO_API_BASE_URL, {
      params: { listing_id: listingId }
    });

    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    bookings.forEach((booking) => {
      const start = booking.start_date.split('T')[0]; // 'YYYY-MM-DD'
      const end = new Date(booking.end_date);
      end.setDate(end.getDate() + 1); // Google Calendar excludes end date, so add 1
      const endFormatted = end.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      calendar.createEvent({
        start,
        end: endFormatted,
        allDay: true,
        summary: booking.summary || 'booking',
        description: booking.description || '',
        location: booking.location || '',
        uid: booking.id.toString()
      });
    });

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `inline; filename=listing-${listingId}.ics`);
    res.send(calendar.toString());
  } catch (err) {
    console.error('Calendar generation error:', err.message || err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync calendar service running on port ${PORT}`);
});
