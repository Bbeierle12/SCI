$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath('Desktop')
$Shortcut = $WshShell.CreateShortcut("$Desktop\SCI App.lnk")
$Shortcut.TargetPath = "cmd.exe"
$Shortcut.Arguments = "/k cd /d `"C:\Users\Bbeie\01_Active_Projects\SCI`" && start http://localhost:3001 && npm run dev"
$Shortcut.WorkingDirectory = "C:\Users\Bbeie\01_Active_Projects\SCI"
$Shortcut.Description = "Apple Supply Chain Intelligence"
$Shortcut.Save()
Write-Host "Desktop shortcut created!"
