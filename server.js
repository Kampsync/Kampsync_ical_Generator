const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your actual Xano API base URL
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

app.get('/calendar/:listingId.ics', async (req, res) => {
  const { listingId } = req.params;

  try {
    // Fetch booking events from Xano
    const response = await axios.get(`${XANO_API_BASE_URL}`, {
      params: { listing_id: listingId },
    });

    const bookings = response.data;

    // Create a new calendar
    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    // Add events to the calendar
    bookings.forEach((booking) => {
      calendar.createEvent({
        summary: booking.summary || 'Booking',
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        uid: booking.id.toString(),
        location: booking.location || '',
        description: booking.description || '',
      });
    });

    // Set headers and send the calendar
res.type('text/calendar');
  } catch (error) {
    console.error('Error fetching booking events:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync iCal service is running on port ${PORT}`);
});
