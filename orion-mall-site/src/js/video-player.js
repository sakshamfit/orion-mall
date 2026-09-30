/**
 * video-player.js — controls for the embedded hero video:
 *   1. In-page walkthrough player with MP4 / YouTube tab switching
 *   2. Fullscreen cinematic video modal triggered from the hero "Watch Hero Video" CTA
 */

export function initVideoPlayer() {
  const cleanups = [];

  /* ---------------- 1. In-page player switcher ---------------- */
  const inPageVideo = document.getElementById('walkthrough-video');
  const inPageIframe = document.getElementById('walkthrough-iframe');
  const btnTabMp4 = document.getElementById('video-tab-mp4');
  const btnTabYt = document.getElementById('video-tab-yt');

  if (btnTabMp4 && btnTabYt && inPageVideo && inPageIframe) {
    const showMp4 = () => {
      btnTabMp4.classList.add('is-active');
      btnTabMp4.setAttribute('aria-selected', 'true');
      btnTabYt.classList.remove('is-active');
      btnTabYt.setAttribute('aria-selected', 'false');
      inPageVideo.classList.remove('is-hidden');
      inPageIframe.classList.add('is-hidden');
      if (inPageIframe.src) inPageIframe.src = '';
    };

    const showYt = () => {
      btnTabYt.classList.add('is-active');
      btnTabYt.setAttribute('aria-selected', 'true');
      btnTabMp4.classList.remove('is-active');
      btnTabMp4.setAttribute('aria-selected', 'false');
      inPageVideo.pause();
      inPageVideo.classList.add('is-hidden');
      inPageIframe.classList.remove('is-hidden');
      const targetSrc =
        inPageIframe.dataset.src || 'https://www.youtube-nocookie.com/embed/ZMde-4KHvGk?rel=0';
      if (!inPageIframe.src || inPageIframe.src !== targetSrc) {
        inPageIframe.src = targetSrc;
      }
    };

    btnTabMp4.addEventListener('click', showMp4);
    btnTabYt.addEventListener('click', showYt);
    cleanups.push(() => {
      btnTabMp4.removeEventListener('click', showMp4);
      btnTabYt.removeEventListener('click', showYt);
    });
  }

  /* ---------------- 2. Video Modal ---------------- */
  const modal = document.getElementById('video-modal');
  const modalVideo = document.getElementById('modal-video-el');
  const modalIframe = document.getElementById('modal-video-iframe');
  const openBtns = document.querySelectorAll('[data-open-video-modal]');
  const closeBtn = document.getElementById('video-modal-close');
  const backdrop = document.getElementById('video-modal-backdrop');
  const modalTabMp4 = document.getElementById('modal-tab-mp4');
  const modalTabYt = document.getElementById('modal-tab-yt');

  let lastActiveElement = null;

  const openModal = () => {
    if (!modal) return;
    lastActiveElement = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Default to MP4 player
    if (modalTabMp4 && modalTabYt && modalVideo && modalIframe) {
      modalTabMp4.classList.add('is-active');
      modalTabYt.classList.remove('is-active');
      modalVideo.classList.remove('is-hidden');
      modalIframe.classList.add('is-hidden');
      if (modalIframe.src) modalIframe.src = '';
      modalVideo.currentTime = 0;
      modalVideo.play().catch(() => {
        // Autoplay policy might require user click; controls are available
      });
    }
    closeBtn?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalVideo) {
      modalVideo.pause();
    }
    if (modalIframe) {
      modalIframe.src = '';
    }
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  };

  openBtns.forEach((btn) => {
    btn.addEventListener('click', openModal);
    cleanups.push(() => btn.removeEventListener('click', openModal));
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    cleanups.push(() => closeBtn.removeEventListener('click', closeModal));
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
    cleanups.push(() => backdrop.removeEventListener('click', closeModal));
  }

  const onKeydown = (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) {
      closeModal();
    }
  };
  window.addEventListener('keydown', onKeydown);
  cleanups.push(() => window.removeEventListener('keydown', onKeydown));

  if (modalTabMp4 && modalTabYt && modalVideo && modalIframe) {
    const switchModalToMp4 = () => {
      modalTabMp4.classList.add('is-active');
      modalTabYt.classList.remove('is-active');
      modalVideo.classList.remove('is-hidden');
      modalIframe.classList.add('is-hidden');
      if (modalIframe.src) modalIframe.src = '';
      modalVideo.play().catch(() => {});
    };

    const switchModalToYt = () => {
      modalTabYt.classList.add('is-active');
      modalTabMp4.classList.remove('is-active');
      modalVideo.pause();
      modalVideo.classList.add('is-hidden');
      modalIframe.classList.remove('is-hidden');
      const targetSrc =
        modalIframe.dataset.src || 'https://www.youtube-nocookie.com/embed/ZMde-4KHvGk?autoplay=1&rel=0';
      modalIframe.src = targetSrc;
    };

    modalTabMp4.addEventListener('click', switchModalToMp4);
    modalTabYt.addEventListener('click', switchModalToYt);
    cleanups.push(() => {
      modalTabMp4.removeEventListener('click', switchModalToMp4);
      modalTabYt.removeEventListener('click', switchModalToYt);
    });
  }

  return function teardown() {
    cleanups.forEach((fn) => fn());
    if (modal?.classList.contains('is-open')) {
      closeModal();
    }
  };
}
