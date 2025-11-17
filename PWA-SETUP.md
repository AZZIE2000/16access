# PWA Setup Guide

## ✅ PWA is Now Enabled!

Your app is now a Progressive Web App (PWA) that can be installed on mobile devices and desktops.

## 🎯 Features

- ✅ **Installable** - Users can install the app on their home screen
- ✅ **Offline Support** - Service worker caches assets for offline use
- ✅ **Smart Install Prompt** - Shows install prompt only on usher and dashboard pages
- ✅ **Vendor Portal Excluded** - Install prompt is hidden on vendor portal pages
- ✅ **Mobile Optimized** - Works great on iOS and Android

## 📱 How to Install

### On Mobile (iOS/Android):

1. Open the website in Safari (iOS) or Chrome (Android)
2. You'll see an install prompt at the bottom of the screen
3. Tap "Install" to add the app to your home screen
4. The app will open in standalone mode (no browser UI)

### On Desktop:

1. Open the website in Chrome, Edge, or other supported browsers
2. Look for the install icon in the address bar
3. Click "Install" to add the app to your desktop
4. The app will open in its own window

## 🚫 Where Install Prompt is Hidden

The install prompt will **NOT** show on:

- `/vendor/*` pages (vendor portal) - **Manifest completely removed from these pages**
- Pages where the user has already dismissed the prompt
- Devices where the app is already installed

### How It Works:

**Two-Layer Protection:**

1. **Manifest Removal** - The vendor portal layout removes the manifest link from the HTML `<head>`, preventing Chrome's native install prompt
2. **Component Detection** - The `PWAInstallPrompt` component checks the route and hides itself on vendor portal pages

## 🎨 Customizing Icons

Replace these files in the `public/` folder with your own icons:

- `icon-192x192.png` - 192x192px icon
- `icon-512x512.png` - 512x512px icon

**Recommended:**

- Use PNG format
- Make icons square
- Use transparent background or solid color
- Ensure icons are recognizable at small sizes

## ⚙️ Configuration

### Manifest (`public/manifest.json`)

Edit this file to customize:

- App name and short name
- Theme colors
- Display mode
- Orientation

### PWA Config (`next.config.js`)

The PWA is configured with:

- Service worker auto-registration
- Skip waiting enabled (updates apply immediately)
- Disabled in development mode
- Output to `public/` folder

## 🧪 Testing

### Test Install Prompt:

1. Clear localStorage: `localStorage.removeItem('pwa-install-dismissed')`
2. Reload the page
3. The install prompt should appear

### Test Offline:

1. Install the app
2. Open DevTools → Network tab
3. Set to "Offline"
4. Reload the app - it should still work!

### Test on Mobile:

1. Deploy to a server with HTTPS (required for PWA)
2. Open on mobile device
3. Test install and offline functionality

## 📝 Notes

- PWA requires HTTPS in production (localhost works for development)
- Service worker files are auto-generated during build
- Service worker files are excluded from git (see `.gitignore`)
- Install prompt uses browser's native `beforeinstallprompt` event
- iOS has limited PWA support compared to Android

## 🔧 Troubleshooting

### Install prompt not showing?

- Check if you're on HTTPS
- Check if the app is already installed
- Check if you dismissed the prompt before
- Check browser console for errors

### Service worker not updating?

- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache
- Unregister old service worker in DevTools

### Icons not showing?

- Check file paths in `manifest.json`
- Ensure icons are in `public/` folder
- Clear browser cache and reinstall

## 📚 Resources

- [Next PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Best Practices](https://web.dev/pwa/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
