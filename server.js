const express = require('express');
const ical = require('ical-generator');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

app.get('/calendar/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  try {
    const { data: bookings } = await axios.get(XANO_API_BASE_URL, {
      params: { listing_id: listingId },
    });

    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    bookings.forEach((booking) => {
      calendar.createEvent({
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        summary: booking.summary || 'Booking',
        description: booking.description || '',
        location: booking.location || '',
        uid: booking.id.toString(),
      });
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="listing.ics"');
    res.send(calendar.toString());
  } catch (err) {
    console.error('Calendar error:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync iCal service running on port ${PORT}`);
});
