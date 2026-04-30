@echo off
cd /d c:\Users\timur\Desktop\Deviny_MVP\frontend
call npx next build > c:\Users\timur\Desktop\Deviny_MVP\build_result.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> c:\Users\timur\Desktop\Deviny_MVP\build_result.txt
