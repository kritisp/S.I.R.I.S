@echo off
REM ==============================================================================
REM S.I.R.I.S. Multi-Container Docker Build & Push Script for Docker Hub
REM ==============================================================================

IF "%~1"=="" (
    echo Usage: docker-push.bat ^<your_dockerhub_username^> [tag]
    echo Example: docker-push.bat crimelens v1.0.0
    exit /b 1
)

SET DOCKER_USER=%~1
SET TAG=%~2
IF "%TAG%"=="" SET TAG=latest

echo ==============================================================================
echo S.I.R.I.S Docker Build & Push Pipeline
echo Docker User : %DOCKER_USER%
echo Image Tag   : %TAG%
echo ==============================================================================

echo.
echo [1/4] Building and Pushing Central Intelligence Backend...
docker build -t %DOCKER_USER%/siris-central-intel:%TAG% -t %DOCKER_USER%/siris-central-intel:latest ./ml/central-intelligence
if %ERRORLEVEL% NEQ 0 ( echo Failed to build central-intel & exit /b %ERRORLEVEL% )
docker push %DOCKER_USER%/siris-central-intel:%TAG%
docker push %DOCKER_USER%/siris-central-intel:latest

echo.
echo [2/4] Building and Pushing FIR/BNS RAG Intelligence Engine...
docker build -t %DOCKER_USER%/siris-fir-bns-rag:%TAG% -t %DOCKER_USER%/siris-fir-bns-rag:latest ./ml/fir-bns-rag
if %ERRORLEVEL% NEQ 0 ( echo Failed to build fir-bns-rag & exit /b %ERRORLEVEL% )
docker push %DOCKER_USER%/siris-fir-bns-rag:%TAG%
docker push %DOCKER_USER%/siris-fir-bns-rag:latest

echo.
echo [3/4] Building and Pushing Voice Gateway Server...
docker build -t %DOCKER_USER%/siris-voice-gateway:%TAG% -t %DOCKER_USER%/siris-voice-gateway:latest ./server
if %ERRORLEVEL% NEQ 0 ( echo Failed to build voice-gateway & exit /b %ERRORLEVEL% )
docker push %DOCKER_USER%/siris-voice-gateway:%TAG%
docker push %DOCKER_USER%/siris-voice-gateway:latest

echo.
echo [4/4] Building and Pushing Frontend Application...
docker build -t %DOCKER_USER%/siris-frontend:%TAG% -t %DOCKER_USER%/siris-frontend:latest ./frontend
if %ERRORLEVEL% NEQ 0 ( echo Failed to build frontend & exit /b %ERRORLEVEL% )
docker push %DOCKER_USER%/siris-frontend:%TAG%
docker push %DOCKER_USER%/siris-frontend:latest

echo.
echo ==============================================================================
echo SUCCESS: All 4 S.I.R.I.S container images pushed to Docker Hub!
echo Images pushed:
echo  - %DOCKER_USER%/siris-central-intel:%TAG%
echo  - %DOCKER_USER%/siris-fir-bns-rag:%TAG%
echo  - %DOCKER_USER%/siris-voice-gateway:%TAG%
echo  - %DOCKER_USER%/siris-frontend:%TAG%
echo ==============================================================================
