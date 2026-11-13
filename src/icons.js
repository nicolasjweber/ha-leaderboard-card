/**
 * Icon rendering helper: uses Home Assistant's <ha-icon> when available,
 * and falls back to crisp inline MDI SVG paths in standalone browser previews.
 */

const MDI_PATHS = {
  'mdi:coffee':
    'M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z',
  'mdi:coffee-outline':
    'M2,21V19H20V21H2M20,8V5H18V8H20M20,3A2,2 0 0,1 22,5V8A2,2 0 0,1 20,10H18V13A4,4 0 0,1 14,17H8A4,4 0 0,1 4,13V3H20M16,5H6V13A2,2 0 0,0 8,15H14A2,2 0 0,0 16,13V5Z',
  'mdi:coffee-maker':
    'M18,6V4H20V2H6C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H20V20H15.97C17.2,19.09 18,17.64 18,16V11H8V16C8,17.64 8.81,19.09 10.03,20H6V4H8V6C8,6.55 8.45,7 9,7H17C17.55,7 18,6.55 18,6M10,16V13H16V16A3,3 0 0,1 13,19A3,3 0 0,1 10,16M13,10A1,1 0 0,0 14,9A1,1 0 0,0 13,8A1,1 0 0,0 12,9A1,1 0 0,0 13,10Z',
  'mdi:cup':
    'M18.32,8H5.67L5.23,4H18.77M3,2L5,20.23C5.13,21.23 5.97,22 7,22H17C18,22 18.87,21.23 19,20.23L21,2H3Z',
  'mdi:cup-water':
    'M18.32,8H5.67L5.23,4H18.77M12,19A3,3 0 0,1 9,16C9,14 12,10.6 12,10.6C12,10.6 15,14 15,16A3,3 0 0,1 12,19M3,2L5,20.23C5.13,21.23 5.97,22 7,22H17C18,22 18.87,21.23 19,20.23L21,2H3Z',
  'mdi:water':
    'M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z',
  'mdi:tea':
    'M4,19H20V21H4V19M17,3H5V13A4,4 0 0,0 9,17H13A4,4 0 0,0 17,13V11H19A2,2 0 0,0 21,9V5A2,2 0 0,0 19,3H17M17,9V5H19V9H17M10.5,5V7.19L12,8.5V12H9V8.5L10.5,7.19V5Z',
  'mdi:trophy':
    'M18 2C17.1 2 16 3 16 4H8C8 3 6.9 2 6 2H2V11C2 12 3 13 4 13H6.2C6.6 15 7.9 16.7 11 17V19.08C8 19.54 8 22 8 22H16C16 22 16 19.54 13 19.08V17C16.1 16.7 17.4 15 17.8 13H20C21 13 22 12 22 11V2H18M6 11H4V4H6V11M20 11H18V4H20V11Z',
  'mdi:trophy-outline':
    'M18 2C17.1 2 16 3 16 4H8C8 3 6.9 2 6 2H2V11C2 12 3 13 4 13H6.2C6.6 15 7.9 16.7 11 17V19.08C8 19.54 8 22 8 22H16C16 22 16 19.54 13 19.08V17C16.1 16.7 17.4 15 17.8 13H20C21 13 22 12 22 11V2H18M6 11H4V4H6V11M16 11.5C16 13.7 14.2 15.5 12 15.5C9.8 15.5 8 13.7 8 11.5V6H16V11.5M20 11H18V4H20V11Z',
  'mdi:crown':
    'M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z',
  'mdi:medal':
    'M20,2H4V4L9.81,8.36C6.14,9.57 4.14,13.53 5.35,17.2C6.56,20.87 10.5,22.87 14.19,21.66C17.86,20.45 19.86,16.5 18.65,12.82C17.95,10.71 16.3,9.05 14.19,8.36L20,4V2M14.94,19.5L12,17.78L9.06,19.5L9.84,16.17L7.25,13.93L10.66,13.64L12,10.5L13.34,13.64L16.75,13.93L14.16,16.17L14.94,19.5Z',
  'mdi:flash':
    'M7,2V13H10V22L17,10H13L17,2H7Z',
  'mdi:thermometer':
    'M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z',
  'mdi:chart-bar':
    'M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z',
  'mdi:currency-usd':
    'M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z',
  'mdi:timer-outline':
    'M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22A9,9 0 0,0 21,13C21,10.88 20.27,8.93 19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,5.98C16.07,4.74 14.12,4 12,4M11,14H13V8H11M15,1H9V3H15V1Z',
  'mdi:podium-gold':
    'M20 22H4V10H8V14H16V10H20V22M10 12H14V6H10V12M12 2L14 4H10L12 2Z',
  'mdi:plus':
    'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z',
  'mdi:delete-outline':
    'M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z',
};

export function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render an icon: uses <ha-icon> inside Home Assistant, or inline SVG fallback
 * when running outside Home Assistant (e.g. standalone browser preview).
 *
 * @param {string} iconName
 * @param {string} className
 * @returns {string}
 */
export function renderIcon(iconName, className = '') {
  const safeIcon = iconName || 'mdi:trophy-outline';
  const hasHaIcon =
    typeof customElements !== 'undefined' && Boolean(customElements.get('ha-icon'));

  if (hasHaIcon) {
    return `<ha-icon class="${escapeAttr(className)}" icon="${escapeAttr(safeIcon)}" aria-hidden="true"></ha-icon>`;
  }

  const path = MDI_PATHS[safeIcon] || MDI_PATHS['mdi:trophy-outline'];
  return `<svg class="fallback-icon ${escapeAttr(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;
}
