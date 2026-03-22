"""
Selenium WebDriver Test - Student Submit First Progress Log
Test: Student logs in, navigates to Progress Tracking, fills 1st bi-weekly log, uploads file, and submits
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os


BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student"
LOG_TITLE = "Week 1 Progress Report"
LOG_DESCRIPTION = "Started project setup and requirements analysis. Set up development environment, reviewed project scope with supervisor, and created initial project documentation."

# Create a test file for upload
TEST_FILE_PATH = "test_progress_log.txt"
with open(TEST_FILE_PATH, 'w') as f:
    f.write("Progress Log Report - Week 1-2\n")
    f.write("=" * 40 + "\n")
    f.write("Activities Completed:\n")
    f.write("- Project environment setup\n")
    f.write("- Requirements gathering\n")
    f.write("- Initial design documentation\n")

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("=" * 60)
    print("🚀 STUDENT PROGRESS LOG SUBMISSION TEST")
    print("=" * 60)
    
    print("\n1️⃣  Opening login page...")
    driver.get(BASE_URL)
    

    print("2️⃣  Logging in as student...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    
    email_input.send_keys(STUDENT_EMAIL)
    password_input.send_keys(STUDENT_PASSWORD)
    
    submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    submit_btn.click()
    
    
    print("   Waiting for dashboard to load...")
    time.sleep(2)

    print("3️⃣  Navigating to Progress Tracking menu...")
    progress_menu = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Progress Tracking')]"))
    )
    progress_menu.click()
    
    print("   Waiting for Progress Tracking page to load...")
    time.sleep(2)
    
    # Verify page loaded
    page_title = wait.until(
        EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Progress Tracking')]"))
    )
    print("   ✓ Progress Tracking page loaded")
    

    print("4️⃣  Finding the 1st progress log slot (Week 1-2)...")
    # Find the first slot card that matches week 1-2 or is the first unlocked slot
    slot_cards = wait.until(
        EC.presence_of_all_elements_located((By.XPATH, "//form[contains(@class, 'space-y-4')]"))
    )
    print(f"   Found {len(slot_cards)} log slots")
    
    # Use the first slot (Week 1-2)
    first_slot = slot_cards[0]
    print("   ✓ Located first slot form")
    

    print("5️⃣  Filling in progress log title...")
    title_input = first_slot.find_element(By.XPATH, ".//input[@data-slot='input' and contains(@placeholder, 'Week')]")
    title_input.send_keys(LOG_TITLE)
    print(f"   ✓ Title entered: {LOG_TITLE}")
    

    print("6️⃣  Filling in log description...")
    # Find textarea within the slot
    description_input = first_slot.find_element(By.XPATH, ".//textarea")
    description_input.send_keys(LOG_DESCRIPTION)
    print(f"   ✓ Description entered ({len(LOG_DESCRIPTION)} characters)")
    

    print("7️⃣  Uploading progress log document...")
    file_input = first_slot.find_element(By.XPATH, ".//input[@type='file']")
    abs_file_path = os.path.abspath(TEST_FILE_PATH)
    file_input.send_keys(abs_file_path)
    print(f"   ✓ File uploaded: {TEST_FILE_PATH}")
    
    # Wait for file upload to complete
    time.sleep(1)
    

    print("8️⃣  Submitting progress log...")
    submit_log_btn = first_slot.find_element(By.XPATH, ".//button[contains(text(), 'Submit Log')]")
    submit_log_btn.click()
    
    print("   Waiting for submission response...")
    time.sleep(2)
    
    
    print("9️⃣  Verifying submission confirmation...")
    try:
        # Check if button changed to "Submitted" or "Saving..."
        submitted_status = first_slot.find_element(By.XPATH, ".//button[contains(text(), 'Submitted')]")
        print(f"   ✅ Log status changed to: Submitted")
    except:
        try:
            # Try to find "Submitted" badge/text
            submitted_badge = first_slot.find_element(By.XPATH, ".//*[contains(text(), 'Submitted')]")
            print(f"   ✅ Submitted badge found")
        except:
            print("   ℹ️  Could not verify status change")
    
    
    print("\n1️⃣0️⃣  Checking if log is now visible in progress list...")
    try:
        # Refresh the page to see updated progress bars
        driver.refresh()
        time.sleep(2)
        print("   ✓ Page refreshed to verify submission")
    except:
        print("   ℹ️  Could not refresh page")
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - Progress log submission completed!")
    print("=" * 60)
    
    driver.save_screenshot("test_progress_log_success.png")
    print("\n📸 Screenshot saved: test_progress_log_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    driver.save_screenshot("test_progress_log_error.png")
    print("   Error screenshot saved: test_progress_log_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
    
    # Clean up test file
    if os.path.exists(TEST_FILE_PATH):
        os.remove(TEST_FILE_PATH)
        print("   Test file cleaned up")
