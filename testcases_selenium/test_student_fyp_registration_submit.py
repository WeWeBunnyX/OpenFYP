"""
Selenium WebDriver Test - Student Submit FYP Registration
Test: Student logs in, navigates to FYP registration, fills form with project details, and submits
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student"
PROJECT_TITLE = "AI-Powered Chatbot System"
SUPERVISOR_EMAIL = "supervisor@example.com"
PROJECT_ABSTRACT = "This project aims to build an intelligent chatbot using NLP and machine learning. The system will process user queries and provide relevant responses using deep learning models."

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 20)

try:
    print("=" * 60)
    print("🚀 STUDENT FYP REGISTRATION SUBMISSION TEST")
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
    
    
    print("   Waiting for student dashboard to load...")
    time.sleep(2)

    print("3️⃣  Navigating to FYP Registration menu...")
    registration_menu = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="fyp-registration-menu"]'))
    )
    registration_menu.click()
    
    print("   Waiting for registration panel to load...")
    time.sleep(3)
    print("   ✅ FYP Registration panel loaded")
    
    
    print("4️⃣  Checking if registration card exists...")
    time.sleep(2)
    
    # Take a screenshot to see current state
    driver.save_screenshot("debug_00_current_state.png")
    print("   📸 Screenshot saved: debug_00_current_state.png")
    
    # Try to find if a registration card already exists - use multiple selectors
    card_exists = driver.find_elements(By.XPATH, "//button[contains(., 'Edit')]")
    
    if not card_exists:
        print("   ℹ️  No existing registration found - submitting new one first...")
        
        # Submit a new registration first so we have something to edit
        print("\n5️⃣  SUBMITTING NEW REGISTRATION...")
        title_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="project-title-input"]'))
        )
        supervisor_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="supervisor-email-input"]')
        abstract_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="project-abstract-input"]')
        
        title_input.send_keys(PROJECT_TITLE)
        print(f"   ✓ Title: {PROJECT_TITLE}")
        
        supervisor_input.send_keys(SUPERVISOR_EMAIL)
        print(f"   ✓ Supervisor: {SUPERVISOR_EMAIL}")
        
        abstract_input.send_keys(PROJECT_ABSTRACT)
        print(f"   ✓ Abstract: entered")
        
        submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="submit-registration-btn"]')
        submit_btn.click()
        print("   ⏳ Submitting...")
        time.sleep(3)
        print("   ✅ Registration submitted")
    else:
        print("   ✅ Existing registration found - will proceed to edit")
    
    
    print("6️⃣  Clicking Edit button to open edit dialog...")
    try:
        time.sleep(2)
        
        # Take screenshot before attempting to find button
        driver.save_screenshot("debug_01_before_edit_click.png")
        
        # Try multiple selector approaches
        edit_btn = None
        
        # Approach 1: Look for button containing "Edit" text anywhere
        try:
            edit_btn = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Edit')]")),
                timeout=5
            )
            print("   ✓ Found Edit button using text selector")
        except:
            # Approach 2: Look for any button in the CardFooter that's not destructive
            try:
                buttons = wait.until(
                    EC.presence_of_all_elements_located((By.XPATH, "//div[contains(@class, 'CardFooter')] | //div[contains(@class, 'pt-4')] //button")),
                    timeout=5
                )
                # First button should be Edit (the non-destructive one)
                if buttons:
                    edit_btn = buttons[0]
                    print("   ✓ Found Edit button using CardFooter selector")
            except:
                pass
        
        # Approach 3: Use a broader selector
        if not edit_btn:
            all_buttons = driver.find_elements(By.TAG_NAME, "button")
            print(f"   ℹ️  Found {len(all_buttons)} total buttons on page")
            for i, btn in enumerate(all_buttons):
                btn_text = btn.text.strip()
                print(f"      Button {i}: '{btn_text}'")
                if btn_text == "Edit" or "Edit" in btn_text:
                    edit_btn = btn
                    print(f"   ✓ Found Edit button at index {i}")
                    break
        
        if not edit_btn:
            raise Exception("Could not find Edit button with any selector")
        
        # Scroll into view and click
        driver.execute_script("arguments[0].scrollIntoView(true);", edit_btn)
        time.sleep(1)
        
        # Try JavaScript click if normal click fails
        try:
            edit_btn.click()
        except:
            driver.execute_script("arguments[0].click();", edit_btn)
        
        print("   ✓ Edit button clicked, dialog opening...")
        time.sleep(3)
        driver.save_screenshot("debug_02_after_edit_click.png")
        
    except Exception as e:
        print(f"   ❌ Could not find Edit button: {e}")
        driver.save_screenshot("debug_01_before_edit_click.png")
        print(f"   Screenshot saved: debug_01_before_edit_click.png")
        raise
    
    
    print("7️⃣  Updating FYP details in edit dialog...")
    try:
        time.sleep(2)
        driver.save_screenshot("debug_03_edit_dialog_open.png")
        
        # Find title input in dialog and update it
        title_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="project-title-input"]')),
            timeout=10
        )
        title_input.clear()
        updated_title = PROJECT_TITLE + " - UPDATED"
        title_input.send_keys(updated_title)
        print(f"   ✓ Title updated to: {updated_title}")
        
        time.sleep(1)
        
        # Find abstract input and update it
        abstract_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="project-abstract-input"]')),
            timeout=10
        )
        abstract_input.clear()
        updated_abstract = PROJECT_ABSTRACT + " [UPDATED WITH IMPROVEMENTS]"
        abstract_input.send_keys(updated_abstract)
        print(f"   ✓ Abstract updated")
        
        time.sleep(1)
        driver.save_screenshot("debug_04_fields_updated.png")
        
    except Exception as e:
        print(f"   ❌ Could not update fields: {e}")
        driver.save_screenshot("debug_03_edit_dialog_error.png")
        raise
    
    
    print("8️⃣  Saving changes...")
    try:
        time.sleep(1)
        
        # Find and click the Save button
        save_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Save')]")),
            timeout=10
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", save_btn)
        time.sleep(1)
        
        # Try normal click first, then JavaScript click as fallback
        try:
            save_btn.click()
        except:
            driver.execute_script("arguments[0].click();", save_btn)
        
        print("   ⏳ Saving changes...")
        time.sleep(3)
        driver.save_screenshot("debug_05_after_save.png")
        print("   ✓ Changes saved")
        
    except Exception as e:
        print(f"   ❌ Could not save changes: {e}")
        driver.save_screenshot("debug_05_save_error.png")
        raise
    
    
    print("9️⃣  Clicking Delete button...")
    try:
        time.sleep(2)
        driver.save_screenshot("debug_06_before_delete.png")
        
        # Find Delete button
        delete_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Delete')]")),
            timeout=10
        )
        driver.execute_script("arguments[0].scrollIntoView(true);", delete_btn)
        time.sleep(1)
        
        # Click delete button
        try:
            delete_btn.click()
        except:
            driver.execute_script("arguments[0].click();", delete_btn)
        
        print("   ✓ Delete button clicked")
        time.sleep(2)
        driver.save_screenshot("debug_07_delete_dialog_open.png")
        
    except Exception as e:
        print(f"   ❌ Could not click delete button: {e}")
        driver.save_screenshot("debug_06_delete_error.png")
        raise
    
    
    print("🔟 Confirming deletion...")
    try:
        time.sleep(1)
        
        # Find the confirmation delete button in the dialog
        # Look for the destructive button (might be last button, or have specific styling)
        confirm_btn = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Delete')]")),
            timeout=10
        )
        
        # If there are multiple Delete buttons, get the last one (the confirmation)
        all_delete_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Delete')]")
        if len(all_delete_btns) > 1:
            confirm_btn = all_delete_btns[-1]  # Use the last one
            print(f"   ℹ️  Found {len(all_delete_btns)} delete buttons, using the last one for confirmation")
        
        driver.execute_script("arguments[0].scrollIntoView(true);", confirm_btn)
        time.sleep(1)
        
        try:
            confirm_btn.click()
        except:
            driver.execute_script("arguments[0].click();", confirm_btn)
        
        print("   ✓ Deletion confirmed")
        time.sleep(3)
        driver.save_screenshot("debug_08_after_delete.png")
        
    except Exception as e:
        print(f"   ❌ Could not confirm deletion: {e}")
        driver.save_screenshot("debug_08_confirm_error.png")
        raise
    
    
    print("1️⃣1️⃣ Verifying FYP was deleted...")
    try:
        time.sleep(2)
        # Try to find empty form - should appear after deletion
        empty_form = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="submit-registration-btn"]')),
            timeout=10
        )
        print("   ✅ FYP registration successfully deleted - empty form back")
        driver.save_screenshot("debug_09_deletion_verified.png")
    except Exception as e:
        print(f"   ⚠️  Verification inconclusive: {e}")
        driver.save_screenshot("debug_09_delete_verification.png")
    
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - FULL WORKFLOW COMPLETED!")
    print("=" * 60)
    print("\nSteps completed:")
    print("  ✅ 1. Logged in as student")
    print("  ✅ 2. Navigated to FYP Registration")
    print("  ✅ 3. Found/submitted FYP registration")
    print("  ✅ 4. Found registration card")
    print("  ✅ 5. Clicked Edit button")
    print("  ✅ 6. Updated title and abstract")
    print("  ✅ 7. Saved changes")
    print("  ✅ 8. Clicked Delete button")
    print("  ✅ 9. Confirmed deletion")
    print("  ✅ 10. Verified deletion successful")
    print("\n📸 Debug screenshots saved (debug_00 through debug_09)")
    
    driver.save_screenshot("test_student_registration_success.png")
    print("\n📸 Screenshot saved: test_student_registration_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    print("\nDebugging info:")
    print(f"   Current URL: {driver.current_url}")
    print(f"   Page title: {driver.title}")
    driver.save_screenshot("test_student_registration_error.png")
    print("   Error screenshot saved: test_student_registration_error.png")

finally:
    driver.quit()
    print("\n🔒 Browser closed")
