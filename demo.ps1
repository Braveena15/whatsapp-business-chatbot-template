$WebhookUrl = $env:DEMO_WEBHOOK_URL
$CustomerPhone = $env:DEMO_CUSTOMER_PHONE
$WabaId = $env:WHATSAPP_BUSINESS_ACCOUNT_ID

function Send-DemoWebhook {

    param(
        [string]$Type,
        [string]$Text,
        [string]$ButtonId,
        [string]$ButtonTitle
    )

    $body = @{
        object = "whatsapp_business_account"
        entry = @(
            @{
                id = $WabaId
                changes = @(
                    @{
                        field = "messages"
                        value = @{
                            messaging_product = "whatsapp"
                            contacts = @(
                                @{
                                    profile = @{
                                        name = "Demo Customer"
                                    }
                                    wa_id = $CustomerPhone
                                }
                            )
                            messages = @()
                        }
                    }
                )
            }
        )
    }

    if($Type -eq "text")
    {
        $body.entry[0].changes[0].value.messages += @{
            from = $CustomerPhone
            id = "wamid.demo.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
            type = "text"
            text = @{
                body = $Text
            }
        }
    }

    if($Type -eq "button")
    {
        $body.entry[0].changes[0].value.messages += @{
            from = $CustomerPhone
            id = "wamid.demo.$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
            timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
            type = "interactive"
            interactive = @{
                type = "button_reply"
                button_reply = @{
                    id = $ButtonId
                    title = $ButtonTitle
                }
            }
        }
    }

    Invoke-RestMethod `
        -Method POST `
        -Uri $WebhookUrl `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json -Depth 15)

    Write-Host ""
    Write-Host "Webhook Sent Successfully" -ForegroundColor Green
}