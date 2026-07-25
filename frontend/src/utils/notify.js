import toast from 'react-hot-toast';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';

const baseOptions = { duration: 4000 };

export const success = (msg, opts = {}) => toast.success(msg, { icon: <CheckCircleIcon className="w-5 h-5 text-white" />, ...baseOptions, ...opts });
export const error = (msg, opts = {}) => toast.error(msg, { icon: <ExclamationTriangleIcon className="w-5 h-5 text-white" />, ...baseOptions, ...opts });
export const info = (msg, opts = {}) => toast(msg, { icon: 'ℹ️', ...baseOptions, ...opts });
export const warn = (msg, opts = {}) => toast(msg, { icon: '⚠️', ...baseOptions, ...opts });

export default { success, error, info, warn };
