const images = [
  "https://images.pexels.com/photos/5716053/pexels-photo-5716053.jpeg?auto=compress&cs=tinysrgb&w=2400&q=90",
  "https://images.pexels.com/photos/6146978/pexels-photo-6146978.jpeg?auto=compress&dpr=1&h=1800&w=2400&q=90",
  "https://images.unsplash.com/photo-1771039621912-0b33cd630815?auto=format&fit=crop&w=2400&q=90",
  "https://images.unsplash.com/photo-1776482128012-a47f853abd57?auto=format&fit=crop&w=2400&q=90",
  "https://www.publicdomainpictures.net/pictures/10000/velka/1-1216221458n7mg.jpg",
  "https://images.unsplash.com/photo-1613629758552-443027994609?auto=format&fit=crop&w=2400&q=90",
];

export function LandingHeroBackground() {
  return (
    <div className="hero-background" aria-hidden="true">
      {images.map((image, index) => (
        <div
          key={image}
          className="hero-background-slide"
          style={{ backgroundImage: `url("${image}")`, animationDelay: `${index * 6 - 1.2}s` }}
        />
      ))}
    </div>
  );
}
