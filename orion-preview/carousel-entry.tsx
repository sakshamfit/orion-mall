import React from "react";
import { createRoot } from "react-dom/client";
import { ArcCardCarousel } from "../components/ui/photo-card-grid";

const mount = document.getElementById("arc-carousel-root");
if (mount) {
  const cards = [
    { image: "https://orionmallgorakhpur.com/wp-content/uploads/2026/06/IMG_0835_result-scaled.jpg", alt: "Van Heusen store at Orion Mall", label: "01 / SHOP", href: "/shop.html" },
    { image: "https://orionmallgorakhpur.com/wp-content/uploads/2026/06/IMG_0809_result-scaled.jpg", alt: "United Colors of Benetton store at Orion Mall", label: "02 / DISCOVER", href: "/shop.html" },
    { image: "https://orionmallgorakhpur.com/wp-content/uploads/2026/06/IMG_0978_result-scaled.jpg", alt: "Domino’s at Orion Mall", label: "03 / DINE", href: "/dine.html" },
    { image: "https://orionmallgorakhpur.com/wp-content/uploads/2026/06/IMG_0921_result-scaled.jpg", alt: "Fun Unlimited at Orion Mall", label: "04 / PLAY", href: "/entertain.html" },
  ];
  createRoot(mount).render(<ArcCardCarousel cards={cards} />);
}
