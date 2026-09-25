const REFRESH_MS = 3000;

const fields = {
  application: document.getElementById('application'),
  version: document.getElementById('version'),
  versionBadge: document.getElementById('version-badge'),
  environment: document.getElementById('environment'),
  status: document.getElementById('status'),
  hostname: document.getElementById('hostname'),
  uptime: document.getElementById('uptime'),
  nodeVersion: document.getElementById('node-version'),
  timestamp: document.getElementById('timestamp'),
  statusPill: document.getElementById('status-pill'),
  statusLabel: document.getElementById('status-label'),
  refreshNote: document.getElementById('refresh-note'),
};

function formatVersion(version) {
  if (!version) {
    return '—';
  }
  return version.startsWith('v') ? version : `v${version}`;
}

function formatUptime(seconds) {
  const value = Number.isFinite(seconds) ? seconds : 0;
  return `${value} s`;
}

function formatTimestamp(isoTimestamp) {
  if (!isoTimestamp) {
    return '—';
  }
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return isoTimestamp;
  }
  return parsed.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function setStatus(isHealthy) {
  fields.statusPill.classList.remove('healthy', 'unhealthy');
  fields.statusPill.classList.add(isHealthy ? 'healthy' : 'unhealthy');
  fields.statusLabel.textContent = isHealthy ? 'Operativo' : 'Sin respuesta';
  fields.status.textContent = isHealthy ? 'Operativo' : 'Sin respuesta';
}

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function refresh() {
  try {
    const [infoResponse, healthResponse] = await Promise.all([
      fetch('/info', { cache: 'no-store' }),
      fetch('/health', { cache: 'no-store' }),
    ]);

    const info = await readJson(infoResponse);
    const health = await readJson(healthResponse);
    const version = formatVersion(info.version);
    const isHealthy = health.status === 'healthy';

    fields.application.textContent = info.application || '—';
    fields.version.textContent = version;
    fields.versionBadge.textContent = version;
    fields.environment.textContent = info.environment || '—';
    fields.hostname.textContent = info.hostname || '—';
    fields.uptime.textContent = formatUptime(info.uptime);
    fields.nodeVersion.textContent = info.nodeVersion || '—';
    fields.timestamp.textContent = formatTimestamp(health.timestamp);
    setStatus(isHealthy);
    fields.refreshNote.textContent = 'Datos en vivo de /health e /info';
  } catch (error) {
    setStatus(false);
    fields.refreshNote.textContent = 'No se pudo actualizar el estado';
  }
}

refresh();
setInterval(refresh, REFRESH_MS);

const menus = [
  { button: document.getElementById('open-creditos'), panel: document.getElementById('creditos-menu') },
  { button: document.getElementById('open-cuentas'), panel: document.getElementById('cuentas-menu') },
  { button: document.getElementById('open-seguros'), panel: document.getElementById('seguros-menu') },
  { button: document.getElementById('open-canales'), panel: document.getElementById('canales-menu') },
];

function closeMenus(except) {
  menus.forEach(({ button, panel }) => {
    if (panel === except) {
      return;
    }
    panel.setAttribute('hidden', '');
    button.setAttribute('aria-expanded', 'false');
  });
}

menus.forEach(({ button, panel }) => {
  button.addEventListener('click', () => {
    const willOpen = panel.hasAttribute('hidden');
    closeMenus(willOpen ? panel : null);
    panel.toggleAttribute('hidden', !willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
  });
});

document.addEventListener('click', (event) => {
  if (menus.some(({ button, panel }) => button.contains(event.target) || panel.contains(event.target))) {
    return;
  }
  closeMenus(null);
});

const track = document.getElementById('hero-track');
const slides = track.children;
const dots = [...document.querySelectorAll('.hero-dot')];
const slider = document.querySelector('.hero-slider');
let index = 0;
let timer = 0;

function showSlide(next) {
  index = (next + slides.length) % slides.length;
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((dot, position) => {
    if (position === index) {
      dot.setAttribute('aria-current', 'true');
    } else {
      dot.removeAttribute('aria-current');
    }
  });
}

function startSlides() {
  window.clearInterval(timer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  timer = window.setInterval(() => showSlide(index + 1), 6500);
}

document.querySelector('.hero-prev').addEventListener('click', () => {
  showSlide(index - 1);
  startSlides();
});
document.querySelector('.hero-next').addEventListener('click', () => {
  showSlide(index + 1);
  startSlides();
});
dots.forEach((dot, position) => {
  dot.addEventListener('click', () => {
    showSlide(position);
    startSlides();
  });
});
slider.addEventListener('mouseenter', () => window.clearInterval(timer));
slider.addEventListener('mouseleave', startSlides);
showSlide(0);
startSlides();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
