const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const { format, addDays } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3000;
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

app.get('/api/calendar/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  try {
    const { data: bookings } = await axios.get(XANO_API_BASE_URL, {
      params: { listing_id: listingId },
    });

    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    bookings.forEach((booking) => {
      calendar.createEvent({
        start: format(new Date(booking.start_date), 'yyyyMMdd'),
        end: format(addDays(new Date(booking.end_date), 1), 'yyyyMMdd'),
        allDay: true,
        summary: booking.summary || 'Booking',
        description: booking.description || '',
        location: booking.location || '',
        uid: booking.id.toString(),
      });
    });

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `inline; filename=listing_${listingId}.ics`);
    res.send(calendar.toString());
  } catch (err) {
    console.error('Calendar generation error:', err.message || err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync calendar service running on port ${PORT}`);
});
