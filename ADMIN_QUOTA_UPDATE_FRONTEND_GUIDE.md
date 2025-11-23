# Admin Quota Update - Frontend Integration Guide

## Overview
This endpoint allows administrators to manually adjust user quotas for customer support, billing corrections, or special promotions.

---

## Endpoint Details

### **URL**
```
PUT /api/subscription/admin/quota/{user_email}
```

### **Method**
`PUT`

### **Authentication**
- Requires admin JWT token in `Authorization` header
- Optional: Additional `X-Admin-Token` header for extra security (to be implemented)

---

## Request

### **Path Parameter**
- `user_email` (string, required) - Email address of the user

### **Headers**
```javascript
{
  "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

### **Request Body**
```json
{
  "operation": "add",
  "quota_amount": 50,
  "quota_type": "addon",
  "reason": "Customer support compensation for service interruption ticket #12345",
  "admin_email": "admin@dms.com"
}
```

### **Request Body Fields**

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `operation` | string | ✅ Yes | Type of operation | Must be: `"set"`, `"add"`, or `"subtract"` |
| `quota_amount` | integer | ✅ Yes | Amount to apply | Must be ≥ 0 |
| `quota_type` | string | ✅ Yes | Which quota to update | Must be: `"monthly"` or `"addon"` |
| `reason` | string | ✅ Yes | Justification for the change | Minimum 10 characters |
| `admin_email` | string | ⚪ Optional | Email of admin making change | For audit trail |

---

## Operations Explained

### **Operation Types**

#### 1. **`"set"`** - Set to exact value
Sets the quota to the specified amount, regardless of current value.

**Example:**
```json
{
  "operation": "set",
  "quota_amount": 100,
  "quota_type": "addon"
}
```
Result: User will have exactly 100 addon fiches.

---

#### 2. **`"add"`** - Add to current quota
Adds the specified amount to the user's current quota.

**Example:**
```json
{
  "operation": "add",
  "quota_amount": 50,
  "quota_type": "addon"
}
```
Result: If user had 20 addon fiches, they now have 70.

---

#### 3. **`"subtract"`** - Remove from quota
Removes the specified amount from the user's current quota (minimum 0).

**Example:**
```json
{
  "operation": "subtract",
  "quota_amount": 30,
  "quota_type": "monthly"
}
```
Result: Increases monthly usage by 30 (reduces available monthly quota).

---

## Quota Types

### **`"monthly"`** - Monthly Subscription Quota
- Affects the user's monthly quota consumption
- Tracks how many fiches used this month
- Resets on renewal date
- **Note:** Backend tracks "used", so operations work inversely:
  - `add` = reduce usage (give back fiches)
  - `subtract` = increase usage (take away fiches)

### **`"addon"`** - Addon Pack Quota
- Affects purchased addon packs remaining balance
- Never auto-resets (persists until consumed)
- Used before monthly quota when generating fiches
- **Note:** Backend tracks "remaining", so operations are direct:
  - `add` = add fiches
  - `subtract` = remove fiches

---

## Response

### **Success Response (200 OK)**
```json
{
  "success": true,
  "message": "Quota updated successfully",
  "user_email": "user@example.com",
  "quota_type": "addon",
  "previous_value": 20,
  "new_value": 70,
  "operation": "add",
  "amount": 50,
  "reason": "Customer support compensation for service interruption ticket #12345",
  "admin_email": "admin@dms.com",
  "updated_at": "2025-11-23T11:30:00.123456Z"
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Operation success status |
| `message` | string | Human-readable result message |
| `user_email` | string | Email of affected user |
| `quota_type` | string | Type of quota updated |
| `previous_value` | integer | Value before update |
| `new_value` | integer | Value after update |
| `operation` | string | Operation performed |
| `amount` | integer | Amount applied |
| `reason` | string | Reason provided |
| `admin_email` | string | Admin who made change |
| `updated_at` | string | ISO timestamp of update |

---

## Error Responses

### **400 Bad Request - Invalid Operation**
```json
{
  "detail": "Invalid operation. Must be 'set', 'add', or 'subtract'"
}
```

### **400 Bad Request - Invalid Quota Type**
```json
{
  "detail": "Invalid quota_type. Must be 'monthly' or 'addon'"
}
```

### **404 Not Found - User Not Found**
```json
{
  "detail": "User not found"
}
```

### **404 Not Found - No Subscription**
```json
{
  "detail": "User has no subscription"
}
```

### **422 Unprocessable Entity - Validation Error**
```json
{
  "detail": [
    {
      "loc": ["body", "reason"],
      "msg": "ensure this value has at least 10 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

### **500 Internal Server Error**
```json
{
  "detail": "Failed to update quota: [error details]"
}
```

---

## Frontend Implementation

### **TypeScript/JavaScript Example**

```typescript
interface AdminQuotaUpdateRequest {
  operation: 'set' | 'add' | 'subtract';
  quota_amount: number;
  quota_type: 'monthly' | 'addon';
  reason: string;
  admin_email?: string;
}

interface AdminQuotaUpdateResponse {
  success: boolean;
  message: string;
  user_email: string;
  quota_type: string;
  previous_value: number;
  new_value: number;
  operation: string;
  amount: number;
  reason: string;
  admin_email: string | null;
  updated_at: string;
}

async function updateUserQuota(
  userEmail: string,
  request: AdminQuotaUpdateRequest
): Promise<AdminQuotaUpdateResponse> {
  
  const adminToken = localStorage.getItem('admin_token'); // Your admin JWT
  
  const response = await fetch(
    `https://your-backend.com/api/subscription/admin/quota/${encodeURIComponent(userEmail)}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update quota');
  }
  
  return await response.json();
}

// Usage Example
try {
  const result = await updateUserQuota('user@example.com', {
    operation: 'add',
    quota_amount: 50,
    quota_type: 'addon',
    reason: 'Compensation for service interruption - Ticket #12345',
    admin_email: 'admin@dms.com'
  });
  
  console.log(`✅ Quota updated: ${result.previous_value} → ${result.new_value}`);
  console.log(`Timestamp: ${result.updated_at}`);
  
} catch (error) {
  console.error('❌ Failed to update quota:', error.message);
}
```

---

## React Component Example

```tsx
import React, { useState } from 'react';

interface QuotaUpdateFormProps {
  userEmail: string;
  onSuccess: () => void;
}

export const QuotaUpdateForm: React.FC<QuotaUpdateFormProps> = ({ 
  userEmail, 
  onSuccess 
}) => {
  const [operation, setOperation] = useState<'set' | 'add' | 'subtract'>('add');
  const [quotaAmount, setQuotaAmount] = useState<number>(0);
  const [quotaType, setQuotaType] = useState<'monthly' | 'addon'>('addon');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const adminToken = localStorage.getItem('admin_token');
      
      const response = await fetch(
        `/api/subscription/admin/quota/${encodeURIComponent(userEmail)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation,
            quota_amount: quotaAmount,
            quota_type: quotaType,
            reason,
            admin_email: 'admin@dms.com' // Get from auth context
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update quota');
      }

      const result = await response.json();
      alert(`✅ Success: ${result.message}\n${result.previous_value} → ${result.new_value}`);
      onSuccess();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quota-update-form">
      <h3>Update Quota for {userEmail}</h3>
      
      <div>
        <label>Operation:</label>
        <select 
          value={operation} 
          onChange={(e) => setOperation(e.target.value as any)}
        >
          <option value="add">Add to quota</option>
          <option value="subtract">Subtract from quota</option>
          <option value="set">Set exact value</option>
        </select>
      </div>

      <div>
        <label>Quota Type:</label>
        <select 
          value={quotaType} 
          onChange={(e) => setQuotaType(e.target.value as any)}
        >
          <option value="addon">Addon Packs</option>
          <option value="monthly">Monthly Quota</option>
        </select>
      </div>

      <div>
        <label>Amount:</label>
        <input 
          type="number" 
          min="0" 
          value={quotaAmount}
          onChange={(e) => setQuotaAmount(parseInt(e.target.value))}
          required
        />
      </div>

      <div>
        <label>Reason (min 10 characters):</label>
        <textarea 
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={10}
          placeholder="e.g., Customer support compensation - Ticket #12345"
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Quota'}
      </button>
    </form>
  );
};
```

---

## Common Use Cases

### **1. Customer Support Compensation**
```json
{
  "operation": "add",
  "quota_amount": 20,
  "quota_type": "addon",
  "reason": "Compensation for service downtime on 2025-11-20 - Ticket #CS-5678"
}
```

### **2. Billing Error Correction**
```json
{
  "operation": "set",
  "quota_amount": 100,
  "quota_type": "monthly",
  "reason": "Billing system error correction - Invoice #INV-2025-11-001"
}
```

### **3. Special Promotion**
```json
{
  "operation": "add",
  "quota_amount": 50,
  "quota_type": "addon",
  "reason": "Black Friday promotion - 50 free fiches campaign"
}
```

### **4. Abuse Prevention**
```json
{
  "operation": "subtract",
  "quota_amount": 100,
  "quota_type": "addon",
  "reason": "Quota abuse detected - Account review case #ABU-789"
}
```

---

## Audit Trail

All quota adjustments are logged in the user's subscription metadata:

```json
{
  "subscription": {
    "metadata": {
      "admin_quota_adjustments": [
        {
          "timestamp": "2025-11-23T11:30:00.123456Z",
          "quota_type": "addon",
          "operation": "add",
          "amount": 50,
          "previous_value": 20,
          "new_value": 70,
          "reason": "Customer support compensation - Ticket #12345",
          "admin_email": "admin@dms.com"
        }
      ]
    }
  }
}
```

---

## Security Considerations

1. **Admin Authentication**: Ensure only authorized admins can access this endpoint
2. **Audit Logging**: All changes are logged with timestamp, admin email, and reason
3. **Validation**: Reason field must be at least 10 characters (forces documentation)
4. **Rate Limiting**: Consider implementing rate limits to prevent abuse
5. **Monitoring**: Track admin quota changes for anomaly detection

---

## Testing

### **Test with cURL**
```bash
curl -X PUT "http://localhost:8000/api/subscription/admin/quota/user@example.com" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "add",
    "quota_amount": 50,
    "quota_type": "addon",
    "reason": "Test quota adjustment for development",
    "admin_email": "admin@test.com"
  }'
```

### **Test Success Scenario**
```bash
# Expected Response:
{
  "success": true,
  "message": "Quota updated successfully",
  "user_email": "user@example.com",
  "quota_type": "addon",
  "previous_value": 20,
  "new_value": 70,
  "operation": "add",
  "amount": 50,
  "reason": "Test quota adjustment for development",
  "admin_email": "admin@test.com",
  "updated_at": "2025-11-23T11:30:00.123456Z"
}
```

---

## Summary

✅ **Endpoint**: `PUT /api/subscription/admin/quota/{user_email}`  
✅ **Authentication**: Bearer token required  
✅ **Operations**: set, add, subtract  
✅ **Quota Types**: monthly, addon  
✅ **Audit Trail**: Logged in subscription metadata  
✅ **Validation**: Reason required (min 10 chars)  

**Ready to integrate into your admin dashboard!**

---

## Backend Requirements & Known Issues

### ⚠️ Backend Model Requirements

For this endpoint to work, the backend `SubscriptionData` model **MUST** have a `metadata` field defined:

```python
class SubscriptionData(BaseModel):
    # ... other fields ...
    metadata: Optional[Dict[str, Any]] = None  # Required for audit trail
```

### 🐛 Common Backend Error

**Error**: `'SubscriptionData' object has no attribute 'metadata'`

**Cause**: The backend Pydantic model `SubscriptionData` is missing the `metadata` field.

**Solution**: Add the `metadata` field to your backend model:

```python
from typing import Optional, Dict, Any
from pydantic import BaseModel

class SubscriptionData(BaseModel):
    user_id: str
    tier: str
    status: str
    # ... other existing fields ...
    
    # Add this field for admin quota adjustments audit trail
    metadata: Optional[Dict[str, Any]] = None
```

The backend endpoint uses `metadata.admin_quota_adjustments` to store the audit trail of all manual quota changes.

### Frontend Error Handling

The frontend implementation includes detailed error logging and user-friendly error messages. If the backend returns an error, the admin will see:
- The full error message from the backend
- Helpful suggestions for common errors (like the metadata issue)
- Option to return to the form and try again

Console logs include:
- 🔧 Request details (operation, amount, type, reason)
- ✅ Success response with before/after values
- ❌ Detailed error information for debugging
