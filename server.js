const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const { v5: uuidv5 } = require('uuid'); // Add this package to generate consistent UUIDs

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
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);

      // Ensure full-day coverage by setting start to 00:00:00 and end to 23:59:59 UTC
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);

      // Generate a deterministic UUID using listing ID and booking UID for consistency
      const uidNamespace = '2d1a697c-b0d0-45d2-9b9e-e6571f1a6a17'; // Replace with your own UUID namespace
      const uid = uuidv5(`${listingId}-${booking.uid}`, uidNamespace);

      calendar.createEvent({
        start,
        end,
        summary: booking.summary || 'booking',
        description: booking.description || '',
        location: booking.location || '',
        uid,
        sequence: 1, // Static for now — increment if event data is edited in future
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
