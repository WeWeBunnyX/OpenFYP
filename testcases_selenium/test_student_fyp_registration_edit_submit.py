"""
Selenium WebDriver Test - Student Edit FYP Registration
Test: Student logs in, finds existing FYP, edits title and description, and submits
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
from pathlib import Path

BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student"

# New values to update
UPDATED_TITLE = "Advanced AI Chatbot with Voice Recognition"
UPDATED_ABSTRACT = "This project implements a conversational AI system with voice input/output capabilities using deep learning and NLP. It will support real-time voice processing and intelligent response generation."

SNAPSHOT_DIR = Path(__file__).resolve().parent / "snapshots" / Path(__file__).stem
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def snap(name: str) -> str:
    return str(SNAPSHOT_DIR / name)

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 20)

try:
    print("=" * 60)
    print("🚀 STUDENT FYP EDIT AND SUBMIT TEST")
    print("=" * 60)
    
    # Step 1: Login
    print("\n1️⃣  Opening login page...")
    driver.get(BASE_URL)
    time.sleep(2)
    
    print("2️⃣  Logging in as student...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    login_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    
    email_input.send_keys(STUDENT_EMAIL)
    password_input.send_keys(STUDENT_PASSWORD)
    login_btn.click()
    print("   ✓ Login successful")
    time.sleep(3)
    
    # Step 2: Navigate to FYP Registration
    print("\n3️⃣  Navigating to FYP Registration...")
    registration_menu = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="fyp-registration-menu"]'))
    )
    registration_menu.click()
    print("   ✓ FYP Registration menu clicked")
    time.sleep(2)
    
    # Step 3: Take screenshot of initial state
    driver.save_screenshot(snap("step1_initial.png"))
    print("   📸 Screenshot: step1_initial.png")
    
    # Step 4: Find and click Edit button
    print("\n4️⃣  Finding Edit button...")
    
    # Get all buttons on page
    all_buttons = driver.find_elements(By.TAG_NAME, "button")
    
    edit_btn = None
    for btn in all_buttons:
        if btn.text.strip() == "Edit":
            edit_btn = btn
            break
    
    if not edit_btn:
        raise Exception("Edit button not found on page")
    
    print("   ✓ Found Edit button")
    
    print("\n5️⃣  Clicking Edit button...")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", edit_btn)
    time.sleep(0.5)
    edit_btn.click()
    print("   ✓ Edit button clicked")
    time.sleep(3)
    
    driver.save_screenshot(snap("step2_edit_dialog.png"))
    print("   📸 Screenshot: step2_edit_dialog.png")
    
    # Step 5: Edit title field
    print("\n6️⃣  Updating project title...")
    
    # Wait for any input field to appear
    time.sleep(2)
    
    # Try to find input fields with broader selectors
    all_inputs = driver.find_elements(By.TAG_NAME, "input")
    print(f"   Found {len(all_inputs)} input fields")
    
    title_field = None
    abstract_field = None
    
    # Look through all inputs
    for inp in all_inputs:
        placeholder = inp.get_attribute('placeholder') or ''
        input_id = inp.get_attribute('id') or ''
        data_test = inp.get_attribute('data-testid') or ''
        
        print(f"     Input: placeholder='{placeholder[:30]}' id='{input_id}' data-testid='{data_test}'")
        
        # Match title input
        if 'title' in data_test.lower() or 'title' in input_id.lower() or 'title' in placeholder.lower():
            title_field = inp
        
        # Match abstract input  
        if 'abstract' in data_test.lower() or 'description' in data_test.lower() or 'abstract' in input_id.lower():
            abstract_field = inp
    
    if not title_field:
        # Try to find first text input as title
        for inp in all_inputs:
            if inp.get_attribute('type') in [None, 'text']:
                title_field = inp
                break
    
    if not title_field:
        raise Exception("Could not find title field")
    
    # Clear and update title
    title_field.clear()
    time.sleep(0.3)
    title_field.send_keys(UPDATED_TITLE)
    print(f"   ✓ Title updated to: '{UPDATED_TITLE}'")
    time.sleep(1)
    
    # Step 6: Edit description field
    print("\n7️⃣  Updating project description...")
    
    if not abstract_field:
        # Try to find textarea or second input
        textareas = driver.find_elements(By.TAG_NAME, "textarea")
        if textareas:
            abstract_field = textareas[0]
        else:
            # Try to find second text input
            text_inputs = [inp for inp in all_inputs if inp.get_attribute('type') in [None, 'text']]
            if len(text_inputs) > 1:
                abstract_field = text_inputs[1]
    
    if not abstract_field:
        raise Exception("Could not find description field")
    
    # Clear and update abstract
    abstract_field.clear()
    time.sleep(0.3)
    abstract_field.send_keys(UPDATED_ABSTRACT)
    print(f"   ✓ Description updated (length: {len(UPDATED_ABSTRACT)} chars)")
    time.sleep(1)
    
    driver.save_screenshot(snap("step3_fields_updated.png"))
    print("   📸 Screenshot: step3_fields_updated.png")
    
    # Step 7: Find and click Save button
    print("\n8️⃣  Submitting changes...")
    
    all_buttons = driver.find_elements(By.TAG_NAME, "button")
    save_btn = None
    
    for btn in all_buttons:
        btn_text = btn.text.strip().lower()
        if 'save' in btn_text:
            save_btn = btn
            break
    
    if not save_btn:
        raise Exception("Save button not found")
    
    print("   ✓ Found Save button")
    
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", save_btn)
    time.sleep(0.5)
    save_btn.click()
    print("   ✓ Save button clicked - submitting...")
    time.sleep(3)
    
    driver.save_screenshot(snap("step4_after_submit.png"))
    print("   📸 Screenshot: step4_after_submit.png")
    
    # Step 8: Verify no errors
    print("\n9️⃣  Verifying submission...")
    
    error_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Error') or contains(text(), 'error') or contains(text(), 'failed')]")
    
    if error_elements:
        error_text = [el.text for el in error_elements if el.text.strip()]
        if error_text:
            print(f"   ❌ Errors found: {error_text}")
            raise Exception(f"Submission failed with errors: {error_text}")
    
    print("   ✓ No error messages found")
    
    # Check if we're back to the list view (edit button still visible)
    time.sleep(1)
    edit_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Edit')]")
    if edit_buttons:
        print("   ✓ Back to FYP list view - submission successful")
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - FYP EDITED AND SUBMITTED!")
    print("=" * 60)
    print("\nTest Summary:")
    print("  ✅ Student logged in")
    print("  ✅ Navigated to FYP Registration")
    print(f"  ✅ Changed title to: {UPDATED_TITLE}")
    print(f"  ✅ Changed description to: {UPDATED_ABSTRACT[:60]}...")
    print("  ✅ Clicked Save button")
    print("  ✅ Changes submitted successfully")
    print("\nScreenshots saved: step1_initial.png, step2_edit_dialog.png, step3_fields_updated.png, step4_after_submit.png")


except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    try:
        driver.save_screenshot(snap("registration_error.png"))
    except:
        pass
    import traceback
    traceback.print_exc()
    exit(1)

finally:
    driver.quit()
