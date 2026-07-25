import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n/config';
import MobileBlockedPage from './pages/MobileBlockedPage';

const isMobileDevice = () => {
	if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
	const userAgent = (navigator.userAgent || '').toLowerCase();
	const platform = (navigator.platform || '').toLowerCase();
	const userAgentData = navigator.userAgentData;
	const maxTouchPoints = navigator.maxTouchPoints || 0;
	const isTouchDevice = maxTouchPoints > 1 || (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches);
	const viewportWidth = window.innerWidth || 0;
	const viewportHeight = window.innerHeight || 0;
	const isSmallViewport = viewportWidth > 0 && viewportHeight > 0 && viewportWidth <= 1280 && viewportHeight <= 1600;

	if (userAgentData?.mobile !== undefined) {
		return userAgentData.mobile;
	}

	return /(android|iphone|ipad|ipod|mobile)/i.test(userAgent)
		|| /(android|iphone|ipad|ipod)/i.test(platform)
		|| (isTouchDevice && isSmallViewport);
};

const pathname = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
const isPublicPath = pathname.startsWith('/public/transactions');

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isMobileDevice() && !isPublicPath) {
	root.render(
		<React.StrictMode>
			<MobileBlockedPage />
		</React.StrictMode>
	);
} else {
	root.render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
}
