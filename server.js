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

  // Generate link if possible
  const platform = booking.source_platform?.toLowerCase();
  const rawUID = booking.uid || '';
  let bookingLink = '';

  // RVshare 
  if (platform?.includes('rvshare') && rawUID.length > 10 && !rawUID.includes('Booking')) {
    bookingLink = `https://rvshare.com/dashboard/reservations`;
  }

  // Outdoorsy 
  if (platform?.includes('outdoorsy') && rawUID.includes('Booking')) {
    const match = rawUID.match(/(\d{6,})/);
    if (match) {
      bookingLink = `https://www.outdoorsy.com/dashboard/bookings/${match[1]}`;
    }

    // Rvezy 
    if (platform?.includes('rvezy') && rawUID.length > 10) {
  bookingLink = `https://www.rvezy.com/owner/reservations/${rawUID}`;
    }

    // Airbnb
    if (platform?.includes('airbnb')) {
  bookingLink = 'https://www.airbnb.com/hosting/reservations';
    }

    // Hipcamp
    if (platform?.includes('hipcamp')) {
  bookingLink = 'View this booking by logging into your Hipcamp host dashboard.';
    }

    // Camplify
    if (platform?.includes('camplify')) {
  bookingLink = 'Log in to your Camplify host dashboard to view booking details.';
    }

    // Yescapa
    if (platform?.includes('yescapa')) {
  bookingLink = 'Log in to your Yescapa dashboard to view booking details.';
    }
}


 
      const summary = [booking.source_platform, booking.summary].filter(Boolean).join(', ') || 'booking';
      const descriptionParts = [];
      if (booking.description) descriptionParts.push(booking.description);
      if (bookingLink) descriptionParts.push(`Booking Link: ${bookingLink}`);
      const description = descriptionParts.join('\n');

      calendar.createEvent({
        start: booking.start_date,
        end: booking.end_date,
        summary: `${booking.source_platform}, ${booking.summary}` || 'booking',
        description: `${booking.description || ''}${bookingLink ? `\nBooking Link: ${bookingLink}` : ''}`,
        location: booking.location || '',
        uid,
        sequence: 1,
        allDay: true
      });
    });

    
    // Save Render .ics link to Xano
try {
  const XANO_API_POST_RENDER_ICAL
 = `https://kampsync-ical-generator.onrender.com/api/calendar/${listingId}.ics`;

  await axios.post(`${XANO_API_POST_RENDER_ICAL
}/save_render_ical`, {
    listing_id: listingId,
    ical_data: renderUrl
  });
} catch (xanoErr) {
  console.error('Failed to update Xano ical_data:', xanoErr.message || xanoErr);
}

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
