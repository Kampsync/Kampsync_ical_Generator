const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const { v5: uuidv5 } = require('uuid');

const app = express();

const PORT = process.env.PORT || 3000;
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

app.get('/api/calendar/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  if (!listingId || !XANO_API_BASE_URL) {
    return res.status(400).send("Missing required parameters or config");
  }

  try {
    const { data: bookings } = await axios.get(XANO_API_BASE_URL, {
      params: { listing_id: listingId }
    });

    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    bookings.forEach((booking) => {
      // Generate stable UID
      const uuidNamespace = '2f1d3dfc-b806-4542-996c-e6f27f1d9a17'; // Replace with your own UUID namespace
      const uid = uuidv5(`${listingId}-${booking.uid}`, uuidNamespace);

      calendar.createEvent({
        start: booking.start_date,
        end: booking.end_date,
        summary: [booking.source_platform, 'booking.summary] || 'booking',
        description: [booking.description, booking.source_platform && `Platform: ${booking.source_platform}`].filter(Boolean).join('\n'),
        location: booking.location || '',
        uid,
        sequence: 1,
        allDay: true
      });
    });

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `inline; filename=listing_${listingId}.ics`);
    res.send(calendar.toString());
  } catch (err) {
    console.error('Calendar generation error:', err.message || err);
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync calendar service running on port ${PORT}`);
});
