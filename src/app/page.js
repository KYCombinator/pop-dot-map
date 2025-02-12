export default function Home() {
  const googleAPIKey = process.env.GOOGLE_API_KEY;

  return (
    <div className="map">
      <iframe
        width="450"
        height="250"
        frameBorder="0"
        style={{ border: 0 }}
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${googleAPIKey}&q=Louisville,KY`}
        allowFullScreen
      ></iframe>
    </div>
  );
}
