#!/bin/bash

# Test Dashboard API endpoints

API_URL="http://localhost:8080"
EMAIL="admin@selfmind.dev"
PASSWORD="admin"

echo "Testing Dashboard API..."
echo "========================"

# 1. Login to get JWT token
echo "1. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/dashboard/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "ERROR: Failed to get authentication token"
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."
echo ""

# 2. Test getting API keys
echo "2. Testing GET /api/dashboard/keys..."
KEYS_RESPONSE=$(curl -s -X GET "$API_URL/api/dashboard/keys" \
  -H "Authorization: Bearer $TOKEN")

echo "Keys response: $KEYS_RESPONSE"
echo ""

# 3. Test creating an API key
echo "3. Testing POST /api/dashboard/keys..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/dashboard/keys" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": "test-user",
    "service": "all",
    "description": "Test key from script",
    "expires_days": 0
  }')

echo "Create response: $CREATE_RESPONSE"
echo ""

# Extract the new key ID
KEY_ID=$(echo $CREATE_RESPONSE | jq -r '.key')
if [ "$KEY_ID" != "null" ] && [ ! -z "$KEY_ID" ]; then
  echo "Successfully created key: $KEY_ID"
  
  # 4. Test deleting the key
  echo ""
  echo "4. Testing DELETE /api/dashboard/keys/$KEY_ID..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/dashboard/keys/$KEY_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Delete response: $DELETE_RESPONSE"
fi

echo ""
echo "Test completed!"