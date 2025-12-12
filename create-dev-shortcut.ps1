# PowerShell script to create a desktop shortcut for running the app in dev mode

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$Home\Desktop\SCI Dev.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\start-electron.bat"
$Shortcut.WorkingDirectory = "$PSScriptRoot"
$Shortcut.Description = "Apple Supply Chain Intelligence - Development Mode"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "You can now double-click 'SCI Dev' on your desktop to start the app." -ForegroundColor Green
