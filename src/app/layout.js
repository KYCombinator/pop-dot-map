import "./globals.css";

export const metadata = {
  title: "Population Dot Map",
  description:
    "An interactive population dot map of Louisville from 1990 - 2020.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
