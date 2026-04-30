$ports = @(3000, 3001, 3002)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        Write-Output "Killing PID $pid on port $port"
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Write-Output "Done - all ports freed"
