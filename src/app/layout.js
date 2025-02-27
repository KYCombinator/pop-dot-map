import "./globals.css";

export const metadata = {
  title: "Population Dot Map",
  description: "An interactive population dot map of Louisville",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
