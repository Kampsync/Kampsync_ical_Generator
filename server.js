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
    const response = await axios.get(`${XANO_API_BASE_URL}/booking_events`, {
      params: { listing_id: listingId },
    });

    const bookings = response.data;

    // Create a new calendar
    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    // Add events to the calendar
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

    // Set headers and send the calendar
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="listing-${listingId}.ics"`);
    res.send(calendar.toString());
  } catch (error) {
    console.error('Error fetching booking events:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`KampSync iCal service is running on port ${PORT}`);
});
