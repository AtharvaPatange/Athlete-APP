@echo off
echo Starting AthleteApp with AI Backend...

REM Check if Python virtual environment exists
if not exist "api\venv" (
    echo Creating Python virtual environment...
    cd api
    python -m venv venv
    cd ..
)

REM Activate virtual environment and install dependencies
echo Installing Python dependencies...
cd api
call venv\Scripts\activate
pip install -r requirements.txt

REM Start FastAPI in background
echo Starting FastAPI server...
start "FastAPI Server" cmd /k "venv\Scripts\activate && python main.py"

REM Go back to main directory
cd ..

REM Install Node.js dependencies if needed
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

REM Start Next.js development server
echo Starting Next.js development server...
npm run dev

pause
