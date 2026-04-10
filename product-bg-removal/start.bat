@echo off
echo Setting up Python environment for Product Background Removal API...

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Setup complete. Starting server...
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
