/**
 * KONFIGURACJA STRONY KONSULTACYJNEJ – RADA OSIEDLA NOWE MIASTO W RZESZOWIE
 *
 * W tym obiekcie w jednym miejscu zaktualizujesz:
 * 1. Datę zakończenia konsultacji, adres e-mail, terminy dyżurów i spotkań.
 * 2. Orientacyjny obszar konsultacji w formacie GeoJSON (CONFIG.map.areaGeoJson).
 *    Wskazówka: własny wielokąt możesz łatwo wyrysować na https://geojson.io
 *    (pamiętaj: GeoJSON zapisuje współrzędne w kolejności [długość, szerokość], czyli [lng, lat]).
 */
const CONFIG = {
  // Prosta blokada hasłem na czas testów (ustaw enabled: false przed publikacją)
  previewGate: {
    enabled: true,
    password: 'NoweMiasto2026'
  },

  consultationEndDate: 'końca stycznia 2026 r.',

  contact: {
    email: '[UZUPEŁNIJ ADRES E-MAIL]',
    dutySchedule: 'w styczniu: każdy czwartek w godz. 17:00–18:00, siedziba Rady Osiedla',
    meetingSchedule: 'ostatni tydzień stycznia 2026 r. (konkretną datę i miejsce podamy z 14-dniowym wyprzedzeniem)'
  },

  map: {
    // Widok Leaflet używa kolejności [szerokość, długość] = [lat, lng]
    center: [50.0255, 22.0115],
    zoom: 15,
    minZoom: 13,
    maxZoom: 18,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    localPreviewTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    localPreviewTileAttribution: 'Tiles &copy; Esri &mdash; Source: Esri, TomTom, Garmin, FAO, NOAA, USGS',

    // Styl obszaru konsultacji na mapie
    areaStyle: {
      color: '#0284C7',
      weight: 3,
      dashArray: '8 6',
      fillColor: '#38BDF8',
      fillOpacity: 0.24
    },

    // Orientacyjny obszar konsultacji (GeoJSON Polygon: współrzędne [lng, lat])
    areaGeoJson: {
      type: 'Feature',
      properties: {
        name: 'Orientacyjny obszar konsultacji SPP – Nowe Miasto',
        description: 'Wyłącznie pasy dróg publicznych zarządzanych przez Miasto Rzeszów. Tereny SM Nowe Miasto są wyłączone.'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [22.0079351, 50.0293695],
          [22.0057793, 50.0246143],
          [22.00691, 50.0240477],
          [22.0073924, 50.0238927],
          [22.0101663, 50.0238346],
          [22.0102568, 50.0215875],
          [22.0172819, 50.0216069],
          [22.0169503, 50.0282122],
          [22.0157442, 50.0282703],
          [22.0145382, 50.0283866],
          [22.0132719, 50.0283672],
          [22.0115231, 50.0285221],
          [22.0098347, 50.0288321],
          [22.0079351, 50.0293695]
        ]]
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  applyConfigContent();
  initNavigation();
  initMobileStickyCta();
  initFaqAccordion();
  const mapApi = initMap();
  initPreviewGate(() => {
    if (mapApi && typeof mapApi.invalidateSize === 'function') {
      mapApi.invalidateSize();
    }
  });
});

/**
 * Tymczasowa kurtyna z hasłem na czas testów roboczych.
 */
function initPreviewGate(onUnlock) {
  if (!CONFIG.previewGate || !CONFIG.previewGate.enabled) return;

  const storageKey = 'spp_preview_unlocked';
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') {
      return;
    }
  } catch (_err) {
    // Brak dostępu do sessionStorage nie blokuje działania bramki
  }

  document.body.classList.add('is-gate-locked');

  const overlay = document.createElement('div');
  overlay.id = 'preview-gate';
  overlay.className = 'preview-gate';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'preview-gate-title');

  overlay.innerHTML = `
    <div class="card preview-gate-card">
      <span class="hero-badge">PODGLĄD ROBOCZY</span>
      <h2 id="preview-gate-title">Wersja robocza – podgląd testowy</h2>
      <p class="preview-gate-desc">
        Strona konsultacyjna Rady Osiedla Nowe Miasto jest w trakcie przygotowania. Wpisz hasło testowe, aby otworzyć podgląd.
      </p>
      <label class="sr-only" for="preview-gate-input">Hasło testowe</label>
      <input
        type="password"
        id="preview-gate-input"
        class="preview-gate-input"
        placeholder="Wpisz hasło testowe..."
        autocomplete="off"
      >
      <button type="button" id="preview-gate-submit" class="btn btn-primary btn-block">
        Otwórz podgląd
      </button>
      <p id="preview-gate-error" class="preview-gate-error" aria-live="polite"></p>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = document.getElementById('preview-gate-input');
  const submitBtn = document.getElementById('preview-gate-submit');
  const errorEl = document.getElementById('preview-gate-error');

  const tryUnlock = () => {
    if (!input) return;
    if (input.value.trim() === CONFIG.previewGate.password) {
      try {
        window.sessionStorage.setItem(storageKey, '1');
      } catch (_err) {
        // Ignoruj błąd zapisu w trybie prywatnym
      }
      document.body.classList.remove('is-gate-locked');
      overlay.remove();
      if (typeof onUnlock === 'function') {
        onUnlock();
      }
    } else {
      if (errorEl) {
        errorEl.textContent = 'Nieprawidłowe hasło. Spróbuj ponownie.';
      }
      input.focus();
      input.select();
    }
  };

  if (submitBtn) {
    submitBtn.addEventListener('click', tryUnlock);
  }
  if (input) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        tryUnlock();
      }
    });
    window.setTimeout(() => input.focus(), 50);
  }
}

/**
 * Uzupełnia dane kontaktowe i datę z CONFIG w odpowiednich elementach strony.
 */
function applyConfigContent() {
  const endDateEls = document.querySelectorAll('[data-config="end-date"]');
  endDateEls.forEach((el) => {
    el.textContent = CONFIG.consultationEndDate;
  });

  const dutyEls = document.querySelectorAll('[data-config="duty-schedule"]');
  dutyEls.forEach((el) => {
    el.textContent = CONFIG.contact.dutySchedule;
  });

  const meetingEls = document.querySelectorAll('[data-config="meeting-schedule"]');
  meetingEls.forEach((el) => {
    el.textContent = CONFIG.contact.meetingSchedule;
  });

  const emailEls = document.querySelectorAll('[data-config="email-text"]');
  emailEls.forEach((el) => {
    el.textContent = CONFIG.contact.email;
  });

  const emailBtn = document.getElementById('email-action-btn');
  const copyBtn = document.getElementById('copy-email-btn');
  const feedbackEl = document.getElementById('copy-feedback');
  const hasRealEmail = CONFIG.contact.email.includes('@') && !CONFIG.contact.email.includes('[UZUPEŁNIJ');

  if (emailBtn) {
    if (hasRealEmail) {
      const subject = encodeURIComponent('Konsultacje SPP – opinia mieszkańca Nowego Miasta');
      emailBtn.setAttribute('href', `mailto:${CONFIG.contact.email}?subject=${subject}`);
    } else {
      emailBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (feedbackEl) {
          feedbackEl.textContent = 'Adres e-mail zostanie wkrótce uzupełniony przez Radę Osiedla w pliku konfiguracyjnym.';
        }
      });
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      if (!hasRealEmail) {
        if (feedbackEl) {
          feedbackEl.textContent = 'Uzupełnij adres e-mail w pliku app.js, aby włączyć kopiowanie.';
        }
        return;
      }

      try {
        await navigator.clipboard.writeText(CONFIG.contact.email);
        if (feedbackEl) {
          feedbackEl.textContent = `Skopiowano adres: ${CONFIG.contact.email}`;
        }
      } catch (_err) {
        if (feedbackEl) {
          feedbackEl.textContent = `Adres e-mail: ${CONFIG.contact.email}`;
        }
      }
    });
  }
}

/**
 * Obsługa mobilnego menu w nagłówku.
 */
function initNavigation() {
  const toggleBtn = document.getElementById('nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggleBtn || !nav) return;

  const closeMenu = () => {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Otwórz menu nawigacji');
    nav.classList.remove('is-open');
  };

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
    toggleBtn.setAttribute('aria-label', isExpanded ? 'Otwórz menu nawigacji' : 'Zamknij menu nawigacji');
    nav.classList.toggle('is-open', !isExpanded);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      closeMenu();
      toggleBtn.focus();
    }
  });
}

/**
 * Ukrywa dolny pasek CTA na mobile, gdy sekcja #zabierz-glos jest widoczna.
 */
function initMobileStickyCta() {
  const stickyBar = document.getElementById('mobile-sticky-cta');
  const targetSection = document.getElementById('zabierz-glos');
  if (!stickyBar || !targetSection || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        stickyBar.classList.toggle('is-hidden', entry.isIntersecting);
      });
    },
    { threshold: 0.12 }
  );

  observer.observe(targetSection);
}

/**
 * Interaktywny akordeon FAQ z płynną animacją i obsługą aria-expanded.
 */
function initFaqAccordion() {
  const triggers = document.querySelectorAll('.faq-trigger');
  triggers.forEach((trigger) => {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    trigger.addEventListener('click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));

      if (isOpen) {
        panel.classList.remove('is-open');
        window.setTimeout(() => {
          if (trigger.getAttribute('aria-expanded') === 'false') {
            panel.hidden = true;
          }
        }, 250);
      } else {
        panel.hidden = false;
        window.requestAnimationFrame(() => {
          panel.classList.add('is-open');
        });
      }
    });
  });
}

/**
 * Inicjalizuje mapę OpenStreetMap przez Leaflet z warstwami GeoJSON z CONFIG.
 */
function initMap() {
  const mapEl = document.getElementById('obszar-map');
  const fallbackEl = document.getElementById('map-fallback');

  if (!mapEl || typeof window.L === 'undefined') {
    if (fallbackEl) {
      fallbackEl.innerHTML =
        '<p><strong>Mapa OpenStreetMap jest obecnie niedostępna.</strong></p>' +
        '<p>Odśwież stronę po odzyskaniu połączenia z internetem.</p>';
    }
    return null;
  }

  if (fallbackEl) {
    fallbackEl.remove();
  }

  const map = window.L.map(mapEl, {
    center: CONFIG.map.center,
    zoom: CONFIG.map.zoom,
    minZoom: CONFIG.map.minZoom,
    maxZoom: CONFIG.map.maxZoom,
    scrollWheelZoom: false
  });

  const isFileProtocol = window.location.protocol === 'file:';

  if (isFileProtocol) {
    window.L.tileLayer(CONFIG.map.localPreviewTileUrl, {
      attribution: CONFIG.map.localPreviewTileAttribution,
      maxZoom: CONFIG.map.maxZoom
    }).addTo(map);
  } else {
    const primaryTiles = window.L.tileLayer(CONFIG.map.tileUrl, {
      attribution: CONFIG.map.tileAttribution,
      maxZoom: CONFIG.map.maxZoom
    }).addTo(map);

    let fallbackApplied = false;
    primaryTiles.on('tileerror', () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      map.removeLayer(primaryTiles);
      window.L.tileLayer(CONFIG.map.localPreviewTileUrl, {
        attribution: CONFIG.map.localPreviewTileAttribution,
        maxZoom: CONFIG.map.maxZoom
      }).addTo(map);
    });
  }

  const areaLayer = window.L.geoJSON(CONFIG.map.areaGeoJson, {
    style: CONFIG.map.areaStyle,
    onEachFeature: (feature, layer) => {
      const name = feature.properties && feature.properties.name ? feature.properties.name : 'Obszar konsultacji';
      const desc = feature.properties && feature.properties.description ? feature.properties.description : '';
      layer.bindPopup(`<strong>${escapeHtml(name)}</strong><br>${escapeHtml(desc)}`);
    }
  }).addTo(map);

  map.fitBounds(areaLayer.getBounds(), { padding: [20, 20] });

  const areaToggle = document.getElementById('toggle-area-layer');
  const resetBtn = document.getElementById('reset-map-view');

  if (areaToggle) {
    areaToggle.addEventListener('change', () => {
      if (areaToggle.checked) {
        areaLayer.addTo(map);
      } else {
        map.removeLayer(areaLayer);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      map.fitBounds(areaLayer.getBounds(), { padding: [20, 20], animate: true });
    });
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);
  });

  return {
    invalidateSize: () => {
      map.invalidateSize();
      map.fitBounds(areaLayer.getBounds(), { padding: [20, 20] });
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
