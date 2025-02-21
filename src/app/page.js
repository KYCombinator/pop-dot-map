export default function Home() {
  const googleAPIKey = process.env.GOOGLE_API_KEY;

  return (
    <div className="h-dvh w-dvw">
      <iframe
        className="h-dvh w-dvw"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${googleAPIKey}&q=38.2527,-85.7585&zoom=12`}
        allowFullScreen
      ></iframe>
    </div>
  );
}
