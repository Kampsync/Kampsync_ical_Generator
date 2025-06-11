const express = require('express');
const axios = require('axios');
const ical = require('ical-generator');
const { v5: uuidv5 } = require('uuid');
const { uploadToGCS } = require('./gcsUploader');

const app = express();

const PORT = process.env.PORT || 3000;
const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;
const XANO_API_POST_RENDER_ICAL = process.env.XANO_API_POST_RENDER_ICAL;

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
      const uuidNamespace = '2f1d3dfc-b806-4542-996c-e6f27f1d9a17';
      const uid = uuidv5(`${listingId}-${booking.uid}`, uuidNamespace);
      const platform = booking.source_platform?.toLowerCase();
      const rawUID = booking.uid || '';
      let bookingLink = '';

      if (platform?.includes('rvshare') && rawUID.length > 10 && !rawUID.includes('Booking')) {
        bookingLink = `https://rvshare.com/dashboard/reservations`;
      }
      if (platform?.includes('outdoorsy') && rawUID.includes('Booking')) {
        const match = rawUID.match(/(\d{6,})/);
        if (match) bookingLink = `https://www.outdoorsy.com/dashboard/bookings/${match[1]}`;
      }
      if (platform?.includes('rvezy') && rawUID.length > 10) {
        bookingLink = `https://www.rvezy.com/owner/reservations/${rawUID}`;
      }
      if (platform?.includes('airbnb')) {
        bookingLink = 'https://www.airbnb.com/hosting/reservations';
      }
      if (platform?.includes('hipcamp')) {
        bookingLink = 'View this booking by logging into your Hipcamp host dashboard.';
      }
      if (platform?.includes('camplify')) {
        bookingLink = 'Log in to your Camplify host dashboard to view booking details.';
      }
      if (platform?.includes('yescapa')) {
        bookingLink = 'Log in to your Yescapa dashboard to view booking details.';
      }

      const summary = [booking.source_platform, booking.summary].filter(Boolean).join(', ') || 'booking';
      const descriptionParts = [];
      if (booking.description) descriptionParts.push(booking.description);
      if (bookingLink) descriptionParts.push(`Booking Link: ${bookingLink}`);
      const description = descriptionParts.join('\n');

      calendar.createEvent({
        start: booking.start_date,
        end: booking.end_date,
        summary,
        description,
        location: booking.location || '',
        uid,
        sequence: 1,
        allDay: true
      });
    });

    // Push render .ics URL to Xano
    if (!XANO_API_POST_RENDER_ICAL) {
      console.warn('⚠️ Missing POST URL for Xano update, skipping...');
    } else {
      const renderUrl = `https://kampsync-ical-generator.onrender.com/api/calendar/${listingId}.ics`;
      console.log('📤 Posting to Xano:', XANO_API_POST_RENDER_ICAL);
      console.log('🧾 Payload:', { listing_id: listingId, ical_data: renderUrl });

      try {
        await axios.post(XANO_API_POST_RENDER_ICAL, {
          listing_id: parseInt(listingId, 10),
          ical_data: renderUrl
        });
        console.log('✅ Successfully updated Xano ical_data');
      } catch (err) {
        console.error('❌ Failed to post to Xano:', err.response?.data || err.message);
      }
    }

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `inline; filename=listing_${listingId}.ics`);

    const filename = `listing_${listingId}.ics`;
    const calendarString = calendar.toString();

    try {
      await uploadToGCS(filename, calendarString);
      console.log(`✅ Uploaded to GCS: ${filename}`);
    } catch (err) {
      console.error('❌ GCS upload failed:', err.message || err);
    }

    res.send(calendarString);
  } catch (err) {
    console.error('❌ Calendar generation error:', err.message || err);
    res.status(500).send('Internal server error');
  }
}); // closes app.get

app.listen(PORT, () => {
  console.log(`KampSync calendar service running on port ${PORT}`);
});
