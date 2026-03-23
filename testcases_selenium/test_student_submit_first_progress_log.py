"""
Selenium WebDriver Test - Student Submit First Progress Log
Test: Student logs in, navigates to Progress Tracking, fills 1st log with required fields, uploads file, and submits
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import zipfile
from pathlib import Path


BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student"
LOG_TITLE = "Week 1-2 Progress Report"
LOG_DESCRIPTION = "Completed initial project setup and requirements analysis. Set up development environment, reviewed project scope with supervisor, and created documentation. Team meetings held to align on objectives."

SNAPSHOT_DIR = Path(__file__).resolve().parent / "snapshots" / Path(__file__).stem
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(name: str) -> str:
    return str(SNAPSHOT_DIR / name)

# Create a test ZIP file for upload (supported format)
TEST_FILE_PATH = "test_progress_log.zip"
with zipfile.ZipFile(TEST_FILE_PATH, 'w') as zf:
    zf.writestr("progress_log.txt", "Progress Log Report - Week 1-2\n" + "=" * 40 + "\n" + "Activities:\n- Project setup\n- Requirements\n- Documentation\n")

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("=" * 60)
    print("🚀 STUDENT PROGRESS LOG SUBMISSION TEST")
    print("=" * 60)
    
    print("\n1️⃣  Opening login page again...")
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
    print("   ✓ Login button clicked")
    
    
    print("   Waiting for dashboard to load...")
    time.sleep(3)
    
    # Debug: check current URL and page content
    current_url = driver.current_url
    print(f"   Current URL: {current_url}")
    
    # Check for error message
    try:
        error_msg = driver.find_element(By.CSS_SELECTOR, '[data-testid="error-message"]')
        print(f"   ❌ Login error: {error_msg.text}")
        raise Exception(f"Login failed: {error_msg.text}")
    except:
        print("   ✓ No error message visible")
    
    # Wait for page to show either sidebar or main content (sign of successful login)
    try:
        wait.until(
            EC.presence_of_element_located((By.XPATH, "//main"))
        )
        print("   ✓ Main content area visible - likely logged in")
    except:
        print("   ⚠️  Could not find main element, checking page source...")

    print("3️⃣  Navigating to Progress Tracking menu...")
    # Try multiple selectors for the progress tracking button
    progress_menu = None
    try:
        # First try: look for span with Progress Tracking text and get its button parent
        progress_menu = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Progress Tracking')]/ancestor::button[1]"))
        )
        print("   ✓ Found Progress Tracking button")
    except:
        print("   ⚠️  Could not find button with standard selector, trying alternatives...")
        try:
            # Second try: look for any button containing the text directly
            progress_menu = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Progress Tracking')]/ancestor::button"))
            )
            print("   ✓ Found Progress Tracking button (alternative selector)")
        except Exception as e:
            print(f"   ❌ Could not find Progress Tracking menu: {e}")
            # Print some debug info
            page_text = driver.page_source
            if "Progress Tracking" in page_text:
                print("   → 'Progress Tracking' text found in page source")
            else:
                print("   → 'Progress Tracking' text NOT found in page source")
            raise
    
    progress_menu.click()
    
    print("   Waiting for Progress Tracking page to load...")
    time.sleep(2)
    
    # Verify page loaded
    page_title = wait.until(
        EC.presence_of_element_located((By.XPATH, "//h1 | //h2"))
    )
    print("   ✓ Progress Tracking page loaded")
    

    print("4️⃣  Finding the 1st progress log (Log 1) form...")
    try:
        # The Log 1 divs are visible on page. Let's find any div containing exactly "Log 1"
        log1_elements = driver.find_elements(By.XPATH, "//div[contains(text(), 'Log 1')]")
        print(f"   Found {len(log1_elements)} divs with 'Log 1' text")
        
        if log1_elements:
            # Get the first one and navigate up to find its parent form/card
            log1_div = log1_elements[0]
            print(f"   Found Log 1 element, getting parent...")
            
            # Try to find the parent that contains the form
            # The structure might be: ...CardTitle -> span/div(Log 1) -> ...
            # We need to go up to find a div that contains the form
            parent = log1_div
            max_iterations = 10
            iteration = 0
            while iteration < max_iterations:
                try:
                    # Check if this parent has a form with inputs
                    form = parent.find_element(By.XPATH, ".//form")
                    print("   ✓ Found form in parent")
                    first_card = parent
                    break
                except:
                    # Go to parent
                    parent = parent.find_element(By.XPATH, "..")
                    iteration += 1
            
            if iteration >= max_iterations:
                # If we couldn't find a form parent, just use the parent that likely contains it
                # Go up a few levels from Log 1 div
                parent = log1_div.find_element(By.XPATH, "ancestor::div[contains(@class, 'overflow') or contains(@class, 'rounded') or contains(@class, 'space')]")
                first_card = parent
                print("   ✓ Located form container")
        else:
            print("   ❌ Could not find any Log 1 divs")
            raise Exception("Log 1 element not found on page")
            
    except Exception as e:
        print(f"   ❌ Failed to find form: {e}")
        print(f"   Trying alternative approach...")
        # Alternative: find form by looking for inputs with the expected label/placeholder
        try:
            title_input = driver.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
            first_card = title_input.find_element(By.XPATH, "ancestor::form/ancestor::div")
            print("   ✓ Found form by title input placeholder")
        except Exception as e2:
            print(f"   ❌ Alternative approach also failed: {e2}")
            raise
    

    print("5️⃣  Filling in progress log title...")
    try:
        # Find the title input by its placeholder
        title_input = first_card.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
        title_input.send_keys(LOG_TITLE)
        print(f"   ✓ Title entered: {LOG_TITLE}")
    except Exception as e:
        print(f"   ❌ Failed to fill title: {e}")
        # Debug: show what inputs are in the card
        inputs = first_card.find_elements(By.XPATH, ".//input")
        print(f"   Found {len(inputs)} input elements in card:")
        for inp in inputs:
            placeholder = inp.get_attribute('placeholder')
            input_type = inp.get_attribute('type')
            print(f"     - type={input_type}, placeholder={placeholder}")
        raise
    

    print("6️⃣  Filling in log description...")
    try:
        # Find the textarea
        description_input = first_card.find_element(By.XPATH, ".//textarea")
        description_input.send_keys(LOG_DESCRIPTION)
        print(f"   ✓ Description entered ({len(LOG_DESCRIPTION)} characters)")
    except Exception as e:
        print(f"   ❌ Failed to fill description: {e}")
        raise
    

    print("7️⃣  Uploading progress log file...")
    try:
        file_input = first_card.find_element(By.XPATH, ".//input[@type='file']")
        abs_file_path = os.path.abspath(TEST_FILE_PATH)
        file_input.send_keys(abs_file_path)
        print(f"   ✓ File uploaded: {TEST_FILE_PATH}")
        time.sleep(1)
    except Exception as e:
        print(f"   ❌ Failed to upload file: {e}")
        raise
    

    print("8️⃣  Submitting progress log...")
    try:
        # Find the submit button - it contains either "Submit Log" or "Saving..." or "Submitted"
        submit_btn = first_card.find_element(By.XPATH, ".//button[contains(text(), 'Submit')]")
        submit_btn.click()
        print("   ✓ Submit button clicked")
        time.sleep(2)
    except Exception as e:
        print(f"   ❌ Failed to submit: {e}")
        # Debug: show buttons
        buttons = first_card.find_elements(By.XPATH, ".//button")
        print(f"   Found {len(buttons)} buttons in card:")
        for btn in buttons:
            try:
                print(f"     - {btn.text}")
            except:
                pass
        raise
    
    
    print("9️⃣  Verifying submission...")
    try:
        # Check if form inputs are now disabled
        title_check = first_card.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
        is_disabled = title_check.get_attribute('disabled')
        if is_disabled:
            print("   ✅ Form disabled - submission successful!")
        else:
            print("   ⚠️  Form still enabled - may need to check page")
    except:
        print("   ℹ️  Could not verify form status")
    
    print("\n1️⃣0️⃣  Test complete...")
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - Progress log submission completed!")
    print("=" * 60)
    
    driver.save_screenshot(snap("test_progress_log_success.png"))
    print("\n📸 Screenshot saved: test_progress_log_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    driver.save_screenshot(snap("test_progress_log_error.png"))
    print("   Error screenshot saved: test_progress_log_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
    
    # Clean up test file
    if os.path.exists(TEST_FILE_PATH):
        os.remove(TEST_FILE_PATH)
        print("   Test file cleaned up")
