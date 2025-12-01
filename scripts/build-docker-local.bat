@echo off
REM Local Docker Build Test Script for Windows
REM Tests the Docker build process locally before pushing to GitHub

echo ============================================
echo ExoMinutes WebApp - Local Docker Build Test
echo ============================================
echo.

REM Configuration
set IMAGE_NAME=exominutes-webapp
set TAG=local-test

REM Build arguments
set NEXT_PUBLIC_API_URL=http://localhost:8000
set NEXT_PUBLIC_ENVIRONMENT=development
set NEXT_PUBLIC_STRIPE_KEY=pk_test_your_test_key_here

echo Build Configuration:
echo    Image: %IMAGE_NAME%:%TAG%
echo    API URL: %NEXT_PUBLIC_API_URL%
echo    Environment: %NEXT_PUBLIC_ENVIRONMENT%
echo.

echo Building Docker image...
docker build ^
  --build-arg NEXT_PUBLIC_API_URL=%NEXT_PUBLIC_API_URL% ^
  --build-arg NEXT_PUBLIC_ENVIRONMENT=%NEXT_PUBLIC_ENVIRONMENT% ^
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=%NEXT_PUBLIC_STRIPE_KEY% ^
  -t %IMAGE_NAME%:%TAG% ^
  -f Dockerfile ^
  .

if errorlevel 1 (
    echo.
    echo Build failed!
    exit /b 1
)

echo.
echo Build successful!
echo.
echo To run the container locally:
echo    docker run -p 3000:3000 %IMAGE_NAME%:%TAG%
echo.
echo Then open: http://localhost:3000
echo.
echo To clean up:
echo    docker rmi %IMAGE_NAME%:%TAG%
