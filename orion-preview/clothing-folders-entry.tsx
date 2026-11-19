import React from "react";
import { createRoot } from "react-dom/client";
import GlassFolder from "../components/ui/glass-folder-cards";
import brands from "./data/brands.json";
import WarpCarousel, { type WarpPhoto } from "../components/ui/warp-carousel";

// Enhance the exported store listings in place, keeping the original content.
const entries = document.querySelectorAll<HTMLElement>('.export-copy .store-listing');
const path = '/' + location.pathname.split('/').pop();
const listings = brands.filter(brand => brand.href === path);
if (listings.length && entries.length === listings.length) {
  document.querySelector('.export-copy')?.classList.add('clothing-folder-directory');
  const dialog = document.createElement('dialog');
  dialog.className = 'folder-photo-dialog';
  dialog.setAttribute('aria-label', 'Store photo');
  const close = document.createElement('button');
  close.type = 'button'; close.setAttribute('aria-label', 'Close photo'); close.textContent = '×';
  const viewer = document.createElement('div');
  dialog.appendChild(close); dialog.appendChild(viewer); document.body.appendChild(dialog);
  const viewerRoot = createRoot(viewer);
  let opener: HTMLButtonElement | null = null;
  let version = 0;
  const showPhotos = (files: WarpPhoto[], brand: string, index: number, button: HTMLButtonElement) => {
    if (!files.length) return;
    opener = button;
    viewerRoot.render(<WarpCarousel key={++version} photos={files} label={brand} initialIndex={index} />);
    dialog.showModal();
  };
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { viewerRoot.render(null); opener?.focus(); });
  entries.forEach((entry, index) => {
    const brand = listings[index];
    const galleries = Array.from(entry.querySelectorAll<HTMLElement>(':scope > .store-gallery'));
    const images = galleries.flatMap(gallery => Array.from(gallery.querySelectorAll<HTMLImageElement>('img')));
    const files = images.map((image, i) => ({ name: `${brand.name} photo ${i + 1}`, image: image.src }));
    const details = document.createElement('div');
    details.className = 'clothing-folder-details';
    while (entry.firstChild) details.appendChild(entry.firstChild);
    const title = document.createElement('h3');
    title.className = 'clothing-folder-brand-name';
    title.textContent = brand.name;
    details.insertBefore(title, details.firstChild);
    // Put the verified logo immediately below the folder, ahead of the business details.
    const oldLogo = Array.from(details.querySelectorAll<HTMLImageElement>(':scope > img')).find(img => brand.image && img.src === brand.image);
    if (oldLogo) { oldLogo.classList.add('store-brand-logo'); details.insertBefore(oldLogo, title); }
    else if (brand.image) { const logo = document.createElement('img'); logo.src = brand.image; logo.alt = `${brand.name} logo`; logo.loading = 'lazy'; logo.className = 'store-brand-logo'; details.insertBefore(logo, title); }
    const photos = document.createElement('div');
    photos.className = 'folder-store-photos';
    photos.id = `store-photos-${index}`;
    images.forEach((image, i) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'folder-photo-thumb';
      button.setAttribute('aria-label', `View ${brand.name} photo ${i + 1} full size`);
      image.parentNode?.insertBefore(button, image); button.appendChild(image);
      button.addEventListener('click', () => showPhotos(files, brand.name, i, button));
    });
    galleries.forEach(gallery => photos.appendChild(gallery));
    if (!images.length) photos.textContent = 'No store photos are available in the original listing.';
    else { const hint = document.createElement('p'); hint.className = 'folder-photo-hint'; hint.textContent = 'Select a photo to enlarge'; photos.insertBefore(hint, photos.firstChild); }
    photos.hidden = true;
    const mount = document.createElement('div');
    entry.appendChild(mount); entry.appendChild(photos); entry.appendChild(details);
    createRoot(mount).render(<GlassFolder label={brand.name} meta={brand.floor} files={files} contentId={photos.id} onPhotoSelect={(i, button) => showPhotos(files, brand.name, i, button)} onOpenChange={open => { photos.hidden = !open; }} />);
  });
}
