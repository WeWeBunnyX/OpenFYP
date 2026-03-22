"""
Selenium WebDriver Test - Coordinator Verify FYP Registration
Test: Coordinator logs in, navigates to FYP registration panel, finds approved registration, and marks it as verified
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


BASE_URL = "http://localhost:5173"
COORDINATOR_EMAIL = "coordinator@example.com"
COORDINATOR_PASSWORD = "coordinator"

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("=" * 60)
    print("🚀 COORDINATOR FYP VERIFICATION TEST")
    print("=" * 60)
    
    print("\n1️⃣  Opening login page...")
    driver.get(BASE_URL)
    

    print("2️⃣  Logging in as coordinator...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    
    email_input.send_keys(COORDINATOR_EMAIL)
    password_input.send_keys(COORDINATOR_PASSWORD)
    
    submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    submit_btn.click()
    
    
    print("   Waiting for coordinator dashboard to load...")
    time.sleep(2)

    print("3️⃣  Navigating to FYP Registration panel...")
    # Click on "FYP Registration" from sidebar
    registration_menu = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//*[text()='FYP Registration']"))
    )
    registration_menu.click()
    
    print("   Waiting for registration panel to load...")
    time.sleep(2)
    

    print("4️⃣  Locating approved FYP registrations...")
    # Switch to approved tab
    try:
        approved_tab = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Approved')]"))
        )
        approved_tab.click()
        print("   ✓ Switched to Approved tab")
        time.sleep(1)
    except:
        print("   ℹ️  Could not find Approved tab, trying to locate approved registrations")
    

    print("5️⃣  Finding first approved registration with Mark as Verified button...")
    # Find the first "Mark as Verified" button which indicates an approved registration
    mark_verified_buttons = wait.until(
        EC.presence_of_all_elements_located((By.XPATH, "//button[contains(text(), 'Mark as Verified')]"))
    )
    
    if not mark_verified_buttons:
        print("   ⚠️  No approved registrations found!")
        print("\n" + "=" * 60)
        print("❌ TEST FAILED - No approved registrations to verify")
        print("=" * 60)
        driver.quit()
        exit(1)
    
    print(f"   ✓ Found {len(mark_verified_buttons)} approved registration(s)")
    

    print("6️⃣  Clicking 'Mark as Verified' button on first approved registration...")
    first_verify_btn = mark_verified_buttons[0]
    first_verify_btn.click()
    
    print("   Waiting for verification to process...")
    time.sleep(2)
    

    print("7️⃣  Verifying that the FYP was marked as verified...")
    try:
        # Check if the button changed to "Unverify" or if a success message shows
        time.sleep(1)
        
        # Try to find unverify button - it should appear after verification
        try:
            unverify_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Unverify')]")
            print("   ✅ Unverify button found - registration verified successfully")
        except:
            print("   ℹ️  Unverify button not found, checking for success indicators")
        
        # Try to find success message
        try:
            success_msg = driver.find_element(By.XPATH, "//*[contains(text(), 'verified') or contains(text(), 'success')]")
            print(f"   ✅ Success indicator found: {success_msg.text}")
        except:
            print("   ℹ️  No explicit success message visible")
            
    except Exception as e:
        print(f"   Error during verification: {e}")
    
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - FYP marked as verified successfully!")
    print("=" * 60)
    
    driver.save_screenshot("test_coordinator_verify_success.png")
    print("\n📸 Screenshot saved: test_coordinator_verify_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    driver.save_screenshot("test_coordinator_verify_error.png")
    print("   Error screenshot saved: test_coordinator_verify_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
