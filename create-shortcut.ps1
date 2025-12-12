$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$Desktop\SCI App.lnk")
$Shortcut.TargetPath = "C:\Users\Bbeie\01_Active_Projects\SCI\start-electron.bat"
$Shortcut.WorkingDirectory = "C:\Users\Bbeie\01_Active_Projects\SCI"
$Shortcut.Description = "Apple Supply Chain Intelligence - Electron App"
$Shortcut.Save()
Write-Host "Desktop shortcut created! Points to start-electron.bat"
