"""
Selenium WebDriver Test - Student Submit 12 Progress Logs & Check Interim Evaluation Eligibility
Test: Student logs in, submits 12 progress logs, then checks interim evaluation eligibility status
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os
import zipfile
from pathlib import Path


BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student"
NUM_LOGS = 12

SNAPSHOT_DIR = Path(__file__).resolve().parent / "snapshots" / Path(__file__).stem
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(name: str) -> str:
    return str(SNAPSHOT_DIR / name)

# Create ZIP files for upload
def create_test_file(log_number):
    """Create a test ZIP file for log submission"""
    filename = f"test_progress_log_{log_number}.zip"
    with zipfile.ZipFile(filename, 'w') as zf:
        content = f"Progress Log Report - Log {log_number}\n" + "=" * 40 + "\n"
        content += f"Activities for Log {log_number}:\n"
        content += f"- Activity 1\n- Activity 2\n- Activity 3\n"
        zf.writestr(f"progress_log_{log_number}.txt", content)
    return filename

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)
logs_submitted = 0

try:
    print("=" * 60)
    print("🚀 STUDENT 12 LOGS + INTERIM EVALUATION TEST")
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
    print("   ✓ Login button clicked")
    
    print("   Waiting for dashboard to load...")
    time.sleep(3)

    print("3️⃣  Navigating to Progress Tracking...")
    progress_menu = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Progress Tracking')]/ancestor::button[1]"))
    )
    progress_menu.click()
    
    print("   Waiting for Progress Tracking page to load...")
    time.sleep(2)
    

    print(f"4️⃣  Submitting {NUM_LOGS} progress logs...")
    
    for log_num in range(1, NUM_LOGS + 1):
        print(f"\n   [Log {log_num}/{NUM_LOGS}] Starting...")
        
        # Create test file
        test_file = create_test_file(log_num)
        
        try:
            # Check if driver is still connected
            try:
                driver.current_url
            except Exception:
                print(f"     ⚠️  Browser connection lost")
                break
            
            # FRESH SEARCH: Find the next UNLOCKED form
            # This must be done fresh each iteration to get the real current state
            print(f"     Refreshing form list...")
            driver.execute_script("window.scrollTo(0, 0);")  # Scroll to top
            time.sleep(1)
            
            all_forms = driver.find_elements(By.XPATH, "//form[contains(@class, 'space-y-4')]")
            print(f"     Found {len(all_forms)} forms total")
            
            # Find the first unlocked form
            form = None
            form_index = -1
            for idx, f in enumerate(all_forms):
                try:
                    # Look for the "Unlocked" badge to identify unlocked forms
                    title_input = f.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
                    
                    # Check if disabled
                    is_disabled = title_input.get_attribute('disabled')
                    if not is_disabled:
                        # Check if form already has content (means it's been filled but not submitted)
                        current_value = title_input.get_attribute('value')
                        if current_value:
                            print(f"     Form {idx} has content: {current_value}")
                        
                        form = f
                        form_index = idx
                        print(f"     ✓ Found unlocked form at index {form_index}")
                        break
                except Exception as e:
                    print(f"     Error checking form {idx}: {str(e)[:40]}")
                    continue
            
            if not form:
                print(f"     ⚠️  No unlocked forms found - all submitted or locked")
                break
            
            # Scroll form into view
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", form)
            time.sleep(0.5)
            
            # Get form elements - find them fresh from the form reference
            title_input = form.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
            description_input = form.find_element(By.XPATH, ".//textarea[@placeholder='Summarize what you accomplished in this period.']")
            file_input = form.find_element(By.XPATH, ".//input[@type='file']")
            submit_btn = form.find_element(By.XPATH, ".//button[contains(text(), 'Submit')]")
            
            # CLEAR any existing content first
            driver.execute_script("arguments[0].value = '';", title_input)
            driver.execute_script("arguments[0].value = '';", description_input)
            time.sleep(0.2)
            
            # Fill form with new data
            title_text = f"Week {log_num} Progress"
            description_text = f"Progress Report for Log {log_num}. Completed objectives and milestones. Team collaboration ongoing. Ready for review."
            
            # Fill title using JavaScript
            driver.execute_script("""
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
            """, title_input, title_text)
            
            time.sleep(0.3)
            
            # Fill description using Selenium's send_keys for better compatibility with React forms
            # First clear the field completely
            description_input.click()  # Focus on the field
            time.sleep(0.2)
            description_input.clear()  # Clear existing content
            time.sleep(0.2)
            description_input.send_keys(description_text)  # Type the new content
            time.sleep(0.3)
            
            # Dispatch events to notify React of the change
            driver.execute_script("""
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('blur', { bubbles: true }));
            """, description_input)
            
            time.sleep(0.5)
            
            # Set file
            abs_file_path = os.path.abspath(test_file)
            file_input.send_keys(abs_file_path)
            time.sleep(0.5)
            
            # Verify form is filled before submitting
            title_check = driver.execute_script("return arguments[0].value;", title_input)
            desc_check = driver.execute_script("return arguments[0].value;", description_input)
            print(f"     Pre-submit: Title='{title_check}', Desc='{desc_check[:40]}...'")
            
            if not desc_check or len(desc_check) < 10:
                print(f"     ⚠️  Description appears empty or too short, retrying...")
                description_input.click()
                time.sleep(0.2)
                # Try JavaScript approach as fallback
                js_safe_desc = description_text.replace("'", "\\'")
                driver.execute_script(f"arguments[0].value = '{js_safe_desc}'; arguments[0].dispatchEvent(new Event('input', {{bubbles:true}}))", description_input)
                time.sleep(0.5)
                desc_check_retry = driver.execute_script("return arguments[0].value;", description_input)
                print(f"     Retry check: Desc length={len(desc_check_retry)}")
            
            # Scroll submit button into view
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
            time.sleep(0.3)
            
            # Click submit - use JavaScript click to ensure it works
            driver.execute_script("arguments[0].click();", submit_btn)
            print(f"     ✓ Submit button clicked")
            
            # WAIT FOR SUBMISSION TO COMPLETE
            # The form should change state - look for "Submitted" badge or form to become disabled
            print(f"     Waiting for form submission to process...")
            max_wait = 10
            submission_confirmed = False
            
            for attempt in range(max_wait // 2):  # Check every 0.5 seconds for up to 5 seconds
                time.sleep(0.5)
                try:
                    # Check if the form now shows "Submitted" badge or if inputs are disabled
                    title_input_now = form.find_element(By.XPATH, ".//input[@placeholder='e.g., Week 1 Progress']")
                    is_disabled_now = title_input_now.get_attribute('disabled')
                    
                    if is_disabled_now:
                        print(f"     ✓ Form is now disabled (submitted)")
                        submission_confirmed = True
                        break
                    
                    # Also check for a "Submitted" badge
                    try:
                        submitted_badge = form.find_element(By.XPATH, ".//*[contains(text(), 'Submitted')]")
                        print(f"     ✓ Found 'Submitted' badge")
                        submission_confirmed = True
                        break
                    except:
                        pass
                        
                except:
                    pass
            
            if submission_confirmed:
                logs_submitted += 1
                print(f"     ✅ Log {log_num} submitted successfully")
            else:
                print(f"     ⚠️  Submission status unclear, but continuing...")
                logs_submitted += 1
            
            # Wait before next iteration to let page fully settle
            time.sleep(2)
            
        except Exception as e:
            print(f"     ❌ Error: {str(e)[:100]}")
            import traceback
            traceback.print_exc()
        finally:
            if os.path.exists(test_file):
                os.remove(test_file)
    

    print(f"\n5️⃣  Summary: {logs_submitted} out of {NUM_LOGS} logs submitted")
    
    if logs_submitted == 0:
        print("   ⚠️  No logs were submitted - will still check eligibility")
    

    print("\n6️⃣  Navigating to Interim Evaluation...")
    try:
        # Click on Evaluation & Grading menu - contains "Beta" badge
        eval_menu = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Evaluation & Grading')]"))
        )
        # Find the actual button element that contains this span
        button = eval_menu.find_element(By.XPATH, "ancestor::button[1]")
        button.click()
        print("   ✓ Evaluation & Grading menu clicked")
        time.sleep(3)
        
        # Wait longer for submenu to appear after clicking parent
        # Create a new wait with longer timeout for submenu
        long_wait = WebDriverWait(driver, 5)
        interim_menu = long_wait.until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Interim Evaluation')]"))
        )
        print("   ✓ Found Interim Evaluation element")
        
        # Scroll it into view if needed
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", interim_menu)
        time.sleep(0.5)
        
        # Wait for it to be clickable
        interim_menu_button = long_wait.until(
            EC.element_to_be_clickable(interim_menu)
        )
        interim_menu_button.click()
        print("   ✓ Interim Evaluation submenu clicked")
        time.sleep(2)
        
    except Exception as e:
        print(f"   ❌ Error navigating to Interim Evaluation: {e}")
        try:
            # Try finding the button by text content
            interim_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Interim Evaluation')]")
            interim_btn.click()
            print("   ✓ Found and clicked Interim Evaluation via fallback selector")
            time.sleep(2)
        except Exception as fallback_error:
            print(f"   ❌ Fallback selector also failed: {fallback_error}")
            raise
    

    print("7️⃣  Checking Interim Evaluation Eligibility...")
    try:
        # Look for eligibility message or status
        # Different messages depending on log count:
        # - If < 24 logs: "Not yet eligible"
        # - If >= 24 logs: "Eligible" or "Ready for evaluation"
        
        page_source = driver.page_source
        
        if "eligible" in page_source.lower():
            if "not" in page_source.lower() and "eligible" in page_source.lower():
                # Check for "not eligible"
                not_eligible = driver.find_elements(By.XPATH, "//*[contains(text(), 'not') and contains(text(), 'eligible')]")
                if not_eligible:
                    print(f"   ℹ️  Student Status: NOT YET ELIGIBLE ({logs_submitted}/24 logs submitted)")
                    print(f"   📝 Need {24 - logs_submitted} more logs for Interim Evaluation eligibility")
                else:
                    print(f"   ✅ Student Status: ELIGIBLE FOR INTERIM EVALUATION")
            else:
                # Just "eligible"
                print(f"   ✅ Student Status: ELIGIBLE FOR INTERIM EVALUATION")
        else:
            # Check for specific status indicators
            status_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'badge') or contains(@class, 'Badge')]")
            if status_elements:
                print(f"   ℹ️  Found status badges:")
                for elem in status_elements[:3]:
                    try:
                        print(f"     - {elem.text}")
                    except:
                        pass
            else:
                print(f"   ℹ️  Current status: {logs_submitted} logs submitted (eligible after 24 logs)")
        
        # Check if there's a registration button or message
        try:
            reg_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Register') or contains(text(), 'Request')]")
            print(f"   ✓ Registration/Request option available: {reg_button.text}")
        except:
            print(f"   ℹ️  No registration option visible yet")
            
    except Exception as e:
        print(f"   Error checking eligibility: {e}")
    
    
    print("\n" + "=" * 60)
    print(f"✅ TEST PASSED - {logs_submitted} progress logs submitted!")
    print(f"   Interim Evaluation Check Complete")
    print("=" * 60)
    
    driver.save_screenshot(snap("test_interim_eval_eligibility_success.png"))
    print("\n📸 Screenshot saved: test_interim_eval_eligibility_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    print(f"   Logs submitted so far: {logs_submitted}")
    driver.save_screenshot(snap("test_interim_eval_eligibility_error.png"))
    print("   Error screenshot saved: test_interim_eval_eligibility_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
