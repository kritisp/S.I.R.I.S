#!/usr/bin/env bash
# ==============================================================================
# S.I.R.I.S. Multi-Container Docker Build & Push Script for Docker Hub
# ==============================================================================

set -e

DOCKER_USER=${1}
TAG=${2:-latest}

if [ -z "$DOCKER_USER" ]; then
    echo "Usage: ./scripts/docker-push.sh <your_dockerhub_username> [tag]"
    echo "Example: ./scripts/docker-push.sh crimelens v1.0.0"
    exit 1
fi

echo "=============================================================================="
echo "S.I.R.I.S Docker Build & Push Pipeline"
echo "Docker User : ${DOCKER_USER}"
echo "Image Tag   : ${TAG}"
echo "=============================================================================="

echo ""
echo "[1/4] Building and Pushing Central Intelligence Backend..."
docker build -t ${DOCKER_USER}/siris-central-intel:${TAG} -t ${DOCKER_USER}/siris-central-intel:latest ./ml/central-intelligence
docker push ${DOCKER_USER}/siris-central-intel:${TAG}
docker push ${DOCKER_USER}/siris-central-intel:latest

echo ""
echo "[2/4] Building and Pushing FIR/BNS RAG Intelligence Engine..."
docker build -t ${DOCKER_USER}/siris-fir-bns-rag:${TAG} -t ${DOCKER_USER}/siris-fir-bns-rag:latest ./ml/fir-bns-rag
docker push ${DOCKER_USER}/siris-fir-bns-rag:${TAG}
docker push ${DOCKER_USER}/siris-fir-bns-rag:latest

echo ""
echo "[3/4] Building and Pushing Voice Gateway Server..."
docker build -t ${DOCKER_USER}/siris-voice-gateway:${TAG} -t ${DOCKER_USER}/siris-voice-gateway:latest ./server
docker push ${DOCKER_USER}/siris-voice-gateway:${TAG}
docker push ${DOCKER_USER}/siris-voice-gateway:latest

echo ""
echo "[4/4] Building and Pushing Frontend Application..."
docker build -t ${DOCKER_USER}/siris-frontend:${TAG} -t ${DOCKER_USER}/siris-frontend:latest ./frontend
docker push ${DOCKER_USER}/siris-frontend:${TAG}
docker push ${DOCKER_USER}/siris-frontend:latest

echo ""
echo "=============================================================================="
echo "SUCCESS: All 4 S.I.R.I.S container images pushed to Docker Hub!"
echo "Images pushed:"
echo " - ${DOCKER_USER}/siris-central-intel:${TAG}"
echo " - ${DOCKER_USER}/siris-fir-bns-rag:${TAG}"
echo " - ${DOCKER_USER}/siris-voice-gateway:${TAG}"
echo " - ${DOCKER_USER}/siris-frontend:${TAG}"
echo "=============================================================================="
