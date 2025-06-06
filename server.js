const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const { v5: uuidv5 } = require('uuid'); // UUID v5 for consistent UID generation

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
     const start = new Date(`${booking.start_date}T00:00:00Z`);
      const end = new Date(`${booking.end_date}T00:00:00Z`);


      const uidNamespace = '21d3d7af-b806-4d2d-99c2-e6f2fddaa1f7'; // Use a fixed namespace you control
      const uid = uuidv5(`${listingId}|${booking.uid}`, uidNamespace);

      calendar.createEvent({
        start,
        end,
        summary: booking.summary || 'booking',
        description: booking.description || '',
        location: booking.location || '',
        uid,
        sequence: 1
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
