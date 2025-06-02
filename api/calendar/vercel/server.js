const axios = require('axios');
const ical = require('ical-generator');

module.exports = async (req, res) => {
  const { listingId } = req.query;
  const XANO_API_BASE_URL = process.env.XANO_API_BASE_URL;

  if (!listingId || !XANO_API_BASE_URL) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    const { data: bookings } = await axios.get(XANO_API_BASE_URL, {
      params: { listing_id: listingId },
      headers: {
        Authorization: `Bearer ${process.env.XANO_API_KEY}`
      }
    });

    const calendar = ical({ name: `KampSync Listing ${listingId}` });

    bookings.forEach((booking) => {
      calendar.createEvent({
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        summary: booking.summary || 'Booking',
        description: booking.description || '',
        location: booking.location || '',
        uid: booking.id.toString()
      });
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="listing_${listingId}.ics"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(calendar.toString());
  } catch (error) {
    console.error('Vercel API error:', error.message || error);
    res.status(500).send('Failed to generate calendar');
  }
};
