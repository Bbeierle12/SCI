$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('C:\Users\Bbeie\OneDrive\Desktop\SCI App.lnk')
Write-Host "Target:" $sc.TargetPath
Write-Host "Arguments:" $sc.Arguments
