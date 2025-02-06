import Image from "next/image";

export default function Home() {

  return (
    <div className="map">
      <img src={"https://maps.googleapis.com/maps/api/staticmap?center=KS&zoom=3&size=400x400&scale=2&key=AIzaSyAQUXhP4aG6RPFLHSALrm0-YhRePs9IwXo"}></img>
    </div>
  );
}
