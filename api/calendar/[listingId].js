import ical from 'ical-generator';
import axios from 'axios';

export default async function handler(req, res) {
  const { listingId } = req.query;
  const baseUrl = process.env.XANO_API_BASE_URL;

  if (!listingId || !baseUrl) {
    return res.status(400).send('Missing listingId or base URL');
  }

  try {
    const { data: bookings } = await axios.get(`${baseUrl}`, {
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
    res.setHeader('Content-Disposition', `inline; filename="listing_${listingId}.ics"`);
    res.setHeader('Cache-Control', 'no-cache');

    res.status(200).send(calendar.toString());
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Failed to generate calendar');
  }
}
