Write-Host "Starting AthleteApp with AI Backend..." -ForegroundColor Green

# Check if Python virtual environment exists
if (-not (Test-Path "api\venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    Set-Location api
    python -m venv venv
    Set-Location ..
}

# Activate virtual environment and install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
Set-Location api
& .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start FastAPI in background
Write-Host "Starting FastAPI server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "Set-Location '$pwd'; .\venv\Scripts\Activate.ps1; python main.py"

# Go back to main directory
Set-Location ..

# Install Node.js dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Next.js development server
Write-Host "Starting Next.js development server..." -ForegroundColor Yellow
npm run dev
