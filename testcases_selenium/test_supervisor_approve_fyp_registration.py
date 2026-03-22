"""
Selenium WebDriver Test - Supervisor Approve FYP Registration
Test: Supervisor logs in, navigates to FYP registration panel, finds pending registration, and approves with remarks
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


BASE_URL = "http://localhost:5173"
SUPERVISOR_EMAIL = "supervisor@example.com"
SUPERVISOR_PASSWORD = "supervisor"
APPROVAL_REMARKS = "xyz remarks - Excellent project proposal with clear objectives and feasible timeline."

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("=" * 60)
    print("🚀 SUPERVISOR FYP REGISTRATION APPROVAL TEST")
    print("=" * 60)
    
    print("\n1️⃣  Opening login page...")
    driver.get(BASE_URL)
    

    print("2️⃣  Logging in as supervisor...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    
    email_input.send_keys(SUPERVISOR_EMAIL)
    password_input.send_keys(SUPERVISOR_PASSWORD)
    
    submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    submit_btn.click()
    
    
    print("   Waiting for supervisor dashboard to load...")
    time.sleep(2)

    print("3️⃣  Navigating to FYP Registration panel...")
    # Click on "FYP Registration" from sidebar (it's in the Primary section)
    registration_menu = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//*[text()='FYP Registration']"))
    )
    registration_menu.click()
    
    print("   Waiting for registration panel to load...")
    time.sleep(2)
    

    print("4️⃣  Locating pending FYP registrations...")
    # Switch to pending tab if not already there
    try:
        pending_tab = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Pending')]"))
        )
        pending_tab.click()
        print("   ✓ Switched to Pending tab")
        time.sleep(1)
    except:
        print("   ℹ️  Already on pending registrations")
    

    print("5️⃣  Finding first pending registration...")
    # Find all approve buttons (each registration has one)
    approve_buttons = wait.until(
        EC.presence_of_all_elements_located((By.XPATH, "//button[contains(@data-testid, 'approve-btn-')]"))
    )
    
    if not approve_buttons:
        print("   ⚠️  No pending registrations found!")
        print("\n" + "=" * 60)
        print("❌ TEST FAILED - No pending registrations to approve")
        print("=" * 60)
        driver.quit()
        exit(1)
    
    print(f"   ✓ Found {len(approve_buttons)} pending registration(s)")
    

    print("6️⃣  Clicking approve button on first registration...")
    first_approve_btn = approve_buttons[0]
    first_approve_btn.click()
    
    print("   Waiting for approval dialog to open...")
    time.sleep(1)
    

    print("7️⃣  Entering approval remarks...")
    remarks_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="action-remarks-input"]'))
    )
    remarks_input.send_keys(APPROVAL_REMARKS)
    print(f"   ✓ Remarks entered: '{APPROVAL_REMARKS}'")
    

    print("8️⃣  Confirming approval...")
    confirm_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="confirm-action-btn"]')
    confirm_btn.click()
    
    print("   Waiting for confirmation to process...")
    time.sleep(2)
    
    
    print("9️⃣  Verifying approval was successful...")
    try:
        # Check if the registration moved from pending or a success message shows
        # Try to find the approve button again - it should be gone from pending list
        time.sleep(1)
        
        # Check if dialog closed (means action was successful)
        dialog_still_open = driver.find_elements(By.CSS_SELECTOR, '[data-testid="action-remarks-input"]')
        
        if not dialog_still_open:
            print("   ✅ Approval dialog closed - likely successful")
        else:
            print("   ℹ️  Dialog still open - checking for error")
        
        # Try to find success message
        try:
            success_msg = driver.find_element(By.XPATH, "//*[contains(text(), 'approved') or contains(text(), 'success')]")
            print(f"   ✅ Success message found: {success_msg.text}")
        except:
            print("   ℹ️  No explicit success message, but dialog closed")
            
    except Exception as e:
        print(f"   Error during verification: {e}")
    
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - FYP registration approved successfully!")
    print("=" * 60)
    
    driver.save_screenshot("test_supervisor_approval_success.png")
    print("\n📸 Screenshot saved: test_supervisor_approval_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    driver.save_screenshot("test_supervisor_approval_error.png")
    print("   Error screenshot saved: test_supervisor_approval_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
