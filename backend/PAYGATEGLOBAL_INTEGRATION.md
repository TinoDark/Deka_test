# PayGateGlobal Integration - Mobile Money Payments (Togo)

## Overview
This integration enables mobile money payments through PayGateGlobal for Togo, supporting FLOOZ and TMONEY services.

## Configuration

### Environment Variables
Add these to your `.env` file:

```bash
# PayGateGlobal Mobile Money (Togo - FLOOZ/TMONEY)
PAYGATEGLOBAL_API_KEY="5c08692e-2c11-4839-a810-cccd34ca2edf"
PAYGATEGLOBAL_BASE_URL="https://paygateglobal.com/api/v1/"
PAYGATEGLOBAL_CALLBACK_URL="https://your-domain.com/payments/paygateglobal/callback"
PAYGATEGLOBAL_RETURN_URL="https://your-domain.com/payment/success"
```

### Callback URL
**Important**: Configure this callback URL in your PayGateGlobal dashboard:
```
https://your-domain.com/payments/paygateglobal/callback
```

## API Endpoints

### Initiate Payment
```http
POST /payments/paygateglobal/initiate
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "orderId": "order-uuid",
  "paymentMethod": "payment_page"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://paygateglobal.com/v1/page?token=...&amount=...&identifier=...",
    "txReference": "PGG-order123-1234567890"
  }
}
```

### Payment Callback (Webhook)
```http
POST /payments/paygateglobal/callback
Content-Type: application/json

{
  "tx_reference": "PGG-order123-1234567890",
  "status": "SUCCESS",
  "amount": 1000,
  "currency": "XOF",
  "phone_number": "22890123456",
  "payment_type": "FLOOZ",
  "transaction_id": "TXN123456",
  "payment_date": "2024-01-01 12:00:00"
}
```

## Supported Services
- **FLOOZ**: Togo's primary mobile money service
- **TMONEY**: Alternative mobile money service in Togo

## Payment Flow
1. **Initiation**: POST to `/payments/paygateglobal/initiate` with order ID
2. **Redirect**: User is redirected to PayGateGlobal hosted payment page
3. **Payment**: User completes payment on PayGateGlobal's secure page
4. **Callback**: PayGateGlobal sends webhook to configured callback URL
5. **Processing**: System processes payment and updates order status

## Error Handling
- Invalid callback data returns `400 Bad Request`
- Order not found returns `404 Not Found`
- Amount mismatch returns `400 Bad Request`
- Duplicate payments are handled via idempotency keys

## Security
- API key authentication with PayGateGlobal
- Webhook signature verification (recommended)
- IP whitelisting for callback endpoint
- Idempotent payment processing

## Testing
Use PayGateGlobal sandbox environment for testing:
- Base URL: `https://paygateglobal.com/api/v1/`
- Test API key provided in configuration

## Production Deployment
1. Update callback URL in PayGateGlobal dashboard
2. Configure production API credentials
3. Enable webhook signature verification
4. Set up IP whitelisting for callback endpoint
5. Test end-to-end payment flow