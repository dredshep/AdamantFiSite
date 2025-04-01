$endpoints = @(
    # RPC Endpoints
    @{
        name = "RPC Status";
        url = "https://scrt.public-rpc.com/status"
    },
    @{
        name = "RPC Node Info";
        url = "https://scrt.public-rpc.com/node_info"
    },
    @{
        name = "RPC Health";
        url = "https://scrt.public-rpc.com/health"
    }
)

Write-Host "Testing Secret Network testnet endpoints..."
Write-Host "----------------------------------------"

# Enable TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
# Ignore SSL/TLS errors
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}

foreach ($endpoint in $endpoints) {
    Write-Host "`nTesting $($endpoint.name)..."
    Write-Host "URL: $($endpoint.url)"
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -Method GET -TimeoutSec 10 -UseBasicParsing
        Write-Host "Status: $($response.StatusCode)"
        
        if ($response.Content) {
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                $prettyJson = $jsonResponse | ConvertTo-Json -Depth 10
                Write-Host "Response:`n$prettyJson"
            } catch {
                Write-Host "Response: $($response.Content)"
            }
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        }
    }
} 