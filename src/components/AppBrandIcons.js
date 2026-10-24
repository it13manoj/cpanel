import React from 'react';

export default function AppBrandIcon({ id, size = 32 }) {
  switch (id) {
    case 'wordpress':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#21759B" />
          <path
            d="M2.5 12c0 3.8 2.3 7 5.7 8.4L3.6 7.6C2.9 8.9 2.5 10.4 2.5 12zm15.1-.3c0-1.4-.5-2.4-1-3.2-.6-.9-1.2-1.7-1.2-2.6 0-1 .8-1.9 1.9-1.9.1 0 .2 0 .3.02C16.1 2.8 14.1 2 12 2 8 2 4.5 4.6 3.3 8.3c.3 0 .7.02 1 .02 1.6 0 4-.2 4-.2.8-.05.9 1.1.1 1.2 0 0-.8.1-1.7.15l5.4 16.1 3.2-9.7-2.3-6.4c-.8-.05-1.5-.15-1.5-.15-.8-.05-.7-1.2.1-1.2 0 0 2.4.2 4 .2 1.6 0 3.9-.2 3.9-.2.8-.05.9 1.1.1 1.2 0 0-.8.1-1.7.15l5.3 15.9c2.3-1.6 3.8-4.3 3.8-7.3 0-2-.6-3.8-1.7-5.3-.1 1.3-.4 2.2-1 3.1zM12 21.9c-.8 0-1.6-.1-2.4-.3l4.2-12.2 4.2 11.5c-1.8.6-3.8 1-6 1zm9.3-8.8c0 1.9-.6 3.6-1.6 5.1L15.3 5.4c1.9 1.4 3.2 3.6 3.8 6.1.4.5.6 1.1.6 1.6z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'woocommerce':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#7F54B3" />
          <path
            d="M6 8.5C6 7.7 6.7 7 7.5 7h9c.8 0 1.5.7 1.5 1.5v5c0 2.2-1.8 4-4 4h-2.5L9 19.5v-2H7.5C6.7 17.5 6 16.8 6 16V8.5z"
            fill="#ffffff"
            opacity="0.2"
          />
          <path
            d="M4.5 9.5c.2 1.7 1.3 4.2 2.2 5.5l1.8-5.5h2l2 5.5c.8-2 1.6-4.5 1.8-5.5h2.2c-.5 2.5-2.2 6.5-3.3 8h-2l-1.7-5-1.7 5h-2c-1.1-1.5-2.8-5.5-3.3-8h2z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'joomla':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#1C3D5A" />
          <circle cx="8" cy="8" r="3" fill="#F44336" />
          <circle cx="16" cy="8" r="3" fill="#4CAF50" />
          <circle cx="8" cy="16" r="3" fill="#FF9800" />
          <circle cx="16" cy="16" r="3" fill="#2196F3" />
        </svg>
      );

    case 'drupal':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#0678BE" />
          <path
            d="M12 3.5C12 3.5 6 9.5 6 14.5c0 3.3 2.7 6 6 6s6-2.7 6-6c0-5-6-11-6-11zm-2.5 14c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5c1.7 0 2.5 1.5 2.5 1.5s-.8 1.5-2.5 1.5zm5 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'ghost':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#15171A" />
          <path
            d="M6 11c0-3.3 2.7-6 6-6s6 2.7 6 6v7l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5v-7z"
            fill="#ffffff"
          />
          <circle cx="9.5" cy="11.5" r="1.5" fill="#15171A" />
          <circle cx="14.5" cy="11.5" r="1.5" fill="#15171A" />
        </svg>
      );

    case 'laravel':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#FF2D20" />
          <path
            d="M6 7l6-3.5L18 7v10l-6 3.5L6 17V7zm6-1.5L8 7.8l4 2.3 4-2.3-4-2.3zm-4.5 4.1v6.8L11 18.5V11.8L7.5 9.6zm9 0l-3.5 2.2v6.7l3.5-2.1V9.6z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'codeigniter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#EE4623" />
          <path
            d="M12 4s-4 4.5-4 8c0 2.2 1.8 4 4 4s4-1.8 4-4c0-3.5-4-8-4-8zm0 13c-2.8 0-5-2.2-5-5 0-3.1 3-6.5 5-8.5 2 2 5 5.4 5 8.5 0 2.8-2.2 5-5 5z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'symfony':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" fill="#000000" />
          <path
            d="M8.5 16.5c-1.5-.8-2-2.3-1.8-3.7.3-1.4 1.5-2.5 3-3 1.2-.4 2.4-.2 3.3.4l-.8 1.4c-.6-.4-1.4-.5-2.2-.2-1 .3-1.7 1-1.9 1.8-.2.9.2 1.8 1.1 2.2.8.4 1.8.2 2.6-.3l.8 1.4c-1.2.7-2.7.9-4.1.2zm7.2-4.8c.8.5 1.3 1.3 1.3 2.2 0 1.8-1.5 3.1-3.5 3.1-.7 0-1.4-.2-2-.5l.7-1.4c.4.2.9.3 1.4.3 1.1 0 1.9-.7 1.9-1.6 0-.6-.3-1.1-.8-1.4l-1.3-.8c-.8-.5-1.3-1.3-1.3-2.2 0-1.7 1.4-3 3.3-3 .6 0 1.2.1 1.7.4l-.7 1.4c-.3-.2-.7-.3-1.1-.3-1 0-1.8.6-1.8 1.5 0 .5.3 1 .8 1.3l1.5.9z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'yii':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0074BD" />
          <path d="M7 6l4 6-3 6H5l3-6-4-6h3z" fill="#E84B37" />
          <path d="M12 6l3 6-3 6h-2l3-6-3-6h2z" fill="#77B93B" />
          <path d="M17 6l3 6-3 6h-2l3-6-3-6h2z" fill="#2F92D0" />
        </svg>
      );

    case 'cakephp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#D33C43" />
          <path
            d="M6 10h12v7c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-7zm3-4c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v2H9V6z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'nodejs_app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#026E00" />
          <path
            d="M12 4l7 4v8l-7 4-7-4V8l7-4zm0 2.2L7 9.5v5l5 2.8 5-2.8v-5l-5-3.3zm0 3.3l3 1.7v3.3l-3 1.7-3-1.7v-3.3l3-1.7z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'python_app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#306998" />
          <path
            d="M11.9 4c-3.1 0-2.9 1.3-2.9 1.3l.03 1.4h3v.4H6.7S4 6.8 4 10c0 3.1 2.3 3 2.3 3h1.4v-1.9s-.1-2.3 2.3-2.3h3.8s2.2.03 2.2-2.2V6.3S16.1 4 11.9 4zM9.5 5.2a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4z"
            fill="#FFD43B"
          />
          <path
            d="M12.1 20c3.1 0 2.9-1.3 2.9-1.3l-.03-1.4h-3v-.4h5.3s2.7.3 2.7-2.9c0-3.1-2.3-3-2.3-3h-1.4v1.9s.1 2.3-2.3 2.3H10s-2.2-.03-2.2 2.2v2.3s-.1 2.3 4.3 2.3zm2.4-1.2a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'java_app':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#5382A1" />
          <path d="M10.5 4c-.5 1.5.5 2.5 1.5 3.5-1-1-1.5-2-1.5-3.5zm3 0c-.5 1.5.5 2.5 1.5 3.5-1-1-1.5-2-1.5-3.5z" stroke="#E76F00" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 10h10v5c0 2-1.5 3.5-3.5 3.5h-3C8.5 18.5 7 17 7 15v-5zm10 1.5h1.5c1 0 1.5.5 1.5 1.5s-.5 1.5-1.5 1.5H17v-3z" fill="#ffffff" />
          <path d="M5.5 20c3 1 10 1 13 0" stroke="#E76F00" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'springboot_app':
    case 'java_springboot':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#6DB33F" />
          <path
            d="M12 4a8 8 0 0 0-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4.4-3.6-8-8-8zm-1 12.5c-2.5 0-4.5-2-4.5-4.5S8.5 7.5 11 7.5c2 0 3.8 1.3 4.3 3.2l-1.9.5c-.3-1-.9-1.7-2.4-1.7-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5c1.5 0 2.1-.8 2.4-1.7l1.9.5c-.5 1.9-2.3 3.2-4.3 3.2z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'docker':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0db7ed" />
          <path
            d="M21 12c-.3-.2-1.5-.3-2.3.2-.3-.6-.8-1-1.5-1.2H16v-2h2v-2h-2V5h-2v2h-2v2h4v2H6c-.5 0-1.5.3-2 1.2-.5 1-.2 2.2.3 2.8 1.5 1.7 4 2.8 7.7 2.8 5 0 8.7-2 9.5-6.5.2-.2.2-.4 0-.5zM7 9h2v2H7V9zm3 0h2v2h-2V9zm-6 2h2v2H4v-2zm3 0h2v2H7v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'opencart':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#23A6DE" />
          <path
            d="M6 7l1.5 2h9.5L16 13H9l-.5-2H6l2 7h9l3-7V7H6zm4 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'magento':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#EE672F" />
          <path
            d="M12 4l7 4.1v8.2l-2.3 1.4V8.4L12 5.6 7.3 8.4v9.3L5 16.3V8.1L12 4zm0 6l3.5 2.1v5.6L12 20l-3.5-2.3v-5.6L12 10z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'prestashop_cms':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#DF0067" />
          <path
            d="M12 4c-3 0-5.5 2.5-5.5 5.5 0 1.2.4 2.3 1 3.2L6 17c-.3.5 0 1.1.5 1.3.5.2 1.1 0 1.3-.5l1.3-3.8c.8.6 1.8 1 2.9 1 3 0 5.5-2.5 5.5-5.5S15 4 12 4zm0 8.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'phpbb':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#12A3EB" />
          <circle cx="8.5" cy="11.5" r="3.5" fill="#ffffff" />
          <circle cx="15.5" cy="11.5" r="3.5" fill="#ffffff" />
          <circle cx="12" cy="15.5" r="2.5" fill="#ffffff" />
        </svg>
      );

    case 'mybb':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#2E4860" />
          <path
            d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-4l-3 3v-3H8a3 3 0 0 1-3-3V8z"
            fill="#E05342"
          />
          <circle cx="9" cy="10.5" r="1" fill="#ffffff" />
          <circle cx="12" cy="10.5" r="1" fill="#ffffff" />
          <circle cx="15" cy="10.5" r="1" fill="#ffffff" />
        </svg>
      );

    case 'flarum':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#E7672E" />
          <path
            d="M6 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-3 3V7z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'whmcs':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#294661" />
          <path
            d="M5 7l2 10h3l1.5-6 1.5 6h3l2-10h-2.5l-1 6-1.5-6h-2l-1.5 6-1-6H5z"
            fill="#5BB75B"
          />
        </svg>
      );

    case 'moodle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#F98012" />
          <path
            d="M12 5l8 4.5-8 4.5-8-4.5L12 5zm-5 7.5v4c0 1.9 2.2 3.5 5 3.5s5-1.6 5-3.5v-4l-5 2.8-5-2.8z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'nextcloud':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0082C9" />
          <circle cx="12" cy="12" r="3.2" fill="#ffffff" />
          <circle cx="6.5" cy="12" r="2.2" fill="#ffffff" />
          <circle cx="17.5" cy="12" r="2.2" fill="#ffffff" />
        </svg>
      );

    case 'roundcube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#3696CB" />
          <rect x="6" y="8" width="12" height="9" rx="2" fill="#ffffff" />
          <path d="M6 9l6 4.5L18 9" stroke="#3696CB" strokeWidth="1.5" />
        </svg>
      );

    case 'matomo':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#B90000" />
          <circle cx="9" cy="13" r="3" fill="#ffffff" />
          <circle cx="15" cy="11" r="3" fill="#ffffff" />
        </svg>
      );

    case 'cicd_pipeline':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#6B46C1" />
          <path
            d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm8-6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
            fill="#ffffff"
          />
          <path d="M8 8v8m0-4h5.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="5" fill="#0284C7" />
          <path
            d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 4z"
            fill="#ffffff"
          />
        </svg>
      );
  }
}

