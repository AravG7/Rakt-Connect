#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RAKT-CONNECT — Network Teardown Script
# Stops all containers, removes volumes, and cleans up artifacts
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "🧹 Rakt-Connect — Tearing down network..."
echo ""

# Stop and remove containers
docker compose -f docker-compose.yaml down --volumes --remove-orphans 2>/dev/null || true

# Remove chaincode containers
docker rm -f $(docker ps -aq --filter name=dev-peer) 2>/dev/null || true

# Remove chaincode images  
docker rmi -f $(docker images -q --filter reference='dev-peer*') 2>/dev/null || true

# Clean generated artifacts
rm -rf crypto-config channel-artifacts

echo ""
echo "✅ Network teardown complete."
echo ""
