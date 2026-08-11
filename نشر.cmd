@echo off
chcp 65001 >nul
cd /d "%~dp0"
title نشر مخطط الرحلة

echo.
echo   ========================================
echo     نشر التعديلات على الإنترنت
echo   ========================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo   [خطأ] Git غير مثبّت على هذا الجهاز.
  echo   نزّله من: https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)

REM رسالة الحفظ: ما تكتبه بعد اسم الملف، أو "تحديث" افتراضًا
set "MSG=%*"
if "%MSG%"=="" set "MSG=تحديث"

echo   [1/4] فحص الأيقونات...
call npm run icons 2>nul
echo.

echo   [2/4] حفظ التغييرات...
git add -A
git diff --cached --quiet
if not errorlevel 1 (
  echo         لا توجد تغييرات جديدة للحفظ.
  echo.
  goto push
)
git commit -m "%MSG%"
echo.

:push
echo   [3/4] الرفع إلى GitHub...
git push
if errorlevel 1 (
  echo.
  echo   [خطأ] فشل الرفع. اقرأ الرسالة أعلاه.
  echo.
  pause
  exit /b 1
)
echo.

echo   [4/4] تم.
echo.
echo   النشر يستغرق دقيقتين تقريبًا، ثم افتح:
echo   https://mjotb.github.io/trip-planner/
echo.
echo   ملاحظة: اضغط Ctrl+F5 في المتصفح لتجاوز النسخة المحفوظة.
echo.
pause
