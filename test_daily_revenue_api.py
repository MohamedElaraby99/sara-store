#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for daily revenue API fixes
Tests the API endpoint and error handling
"""

import requests
import json
from datetime import datetime, timedelta

def test_daily_revenue_api():
    """Test the daily revenue API endpoint"""
    
    base_url = "http://127.0.0.1:8006"
    
    print("🔍 Testing Daily Revenue API Fixes...")
    print("=" * 50)
    
    # Test 1: Valid date range
    print("\n1. Testing valid date range...")
    try:
        # Use dates from the past week
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=7)
        
        url = f"{base_url}/api/sales/daily-revenue?date_from={start_date}&date_to={end_date}"
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ API returned success response")
                print(f"   Total days: {data.get('total_days', 0)}")
                print(f"   Date range: {data.get('date_range', {})}")
            else:
                print(f"❌ API returned error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing valid date range: {e}")
    
    # Test 2: Future dates (should return 400)
    print("\n2. Testing future dates...")
    try:
        future_date = (datetime.now() + timedelta(days=30)).date()
        url = f"{base_url}/api/sales/daily-revenue?date_from={future_date}&date_to={future_date}"
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print("✅ Correctly rejected future dates")
            print(f"   Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            try:
                data = response.json()
                print(f"   Response: {data}")
            except:
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing future dates: {e}")
    
    # Test 3: Invalid date format
    print("\n3. Testing invalid date format...")
    try:
        url = f"{base_url}/api/sales/daily-revenue?date_from=invalid-date&date_to=2024-01-01"
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print("✅ Correctly rejected invalid date format")
            print(f"   Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            try:
                data = response.json()
                print(f"   Response: {data}")
            except:
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing invalid date format: {e}")
    
    # Test 4: Start date after end date
    print("\n4. Testing start date after end date...")
    try:
        end_date = datetime.now().date()
        start_date = end_date + timedelta(days=1)
        url = f"{base_url}/api/sales/daily-revenue?date_from={start_date}&date_to={end_date}"
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print("✅ Correctly rejected invalid date range")
            print(f"   Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            try:
                data = response.json()
                print(f"   Response: {data}")
            except:
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing invalid date range: {e}")
    
    # Test 5: No date parameters
    print("\n5. Testing no date parameters...")
    try:
        url = f"{base_url}/api/sales/daily-revenue"
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ API handled no date parameters correctly")
                print(f"   Total days: {data.get('total_days', 0)}")
            else:
                print(f"❌ API returned error: {data.get('error', 'Unknown error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text}")
                
    except Exception as e:
        print(f"❌ Error testing no date parameters: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Daily Revenue API Test Summary:")
    print("- Check that future dates are rejected with 400 status")
    print("- Check that invalid date formats are rejected")
    print("- Check that invalid date ranges are rejected")
    print("- Check that valid requests return proper JSON responses")
    print("- Verify error messages are in Arabic and helpful")

if __name__ == "__main__":
    test_daily_revenue_api() 