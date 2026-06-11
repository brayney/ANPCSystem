#!/bin/sh
set -e
cd backend
npm install
npm run build 2>/dev/null || true
