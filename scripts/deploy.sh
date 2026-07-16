#!/bin/bash
set -e

echo "=== Demeter Yield Optimizer — Deploy ==="
echo ""

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Deploy
echo "Deploying to Vercel..."
echo ""
echo "You'll need to set these env vars in Vercel:"
echo "  PAY_TO_ADDRESS  (your X Layer wallet address)"
echo "  SKIP_X402       (false for production)"
echo ""
echo "Run: vercel --prod"
echo ""
echo "After deploy, set env vars at:"
echo "  https://vercel.com/$(whoami)/demeter-yield-asp/settings/environment-variables"
