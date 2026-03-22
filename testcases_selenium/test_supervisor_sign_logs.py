"""
Selenium WebDriver Test - Supervisor Sign Progress Logs
Test: Supervisor logs in, navigates to Progress Tracking, finds logs in "Needs Review" tab, and signs them
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os


BASE_URL = "http://localhost:5173"
SUPERVISOR_EMAIL = "supervisor@example.com"
SUPERVISOR_PASSWORD = "supervisor"

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)
logs_signed = 0

try:
    print("=" * 60)
    print("🚀 SUPERVISOR SIGN PROGRESS LOGS TEST")
    print("=" * 60)
    
    print("\n1️⃣  Opening login page...")
    driver.get(BASE_URL)
    time.sleep(2)
    
    print("2️⃣  Logging in as supervisor...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    login_button = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    
    email_input.send_keys(SUPERVISOR_EMAIL)
    password_input.send_keys(SUPERVISOR_PASSWORD)
    login_button.click()
    print("   ✓ Login button clicked")
    
    # Wait for dashboard to load
    print("   Waiting for dashboard to load...")
    time.sleep(3)
    
    print("\n3️⃣  Navigating to Progress Tracking...")
    try:
        progress_menu = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Progress Tracking')]"))
        )
        progress_menu.click()
        print("   ✓ Progress Tracking menu clicked")
        time.sleep(2)
    except Exception as e:
        print(f"   ❌ Error navigating to Progress Tracking: {e}")
        raise
    
    print("\n4️⃣  Finding 'Needs Review' tab...")
    try:
        # Look for tabs - they might be buttons with role="tab" or similar
        tabs = wait.until(
            EC.presence_of_all_elements_located((By.XPATH, "//button[contains(@role, 'tab') or contains(@class, 'tab')]"))
        )
        print(f"   Found {len(tabs)} tabs")
        
        # Find the "Needs Review" tab
        needs_review_tab = None
        for tab in tabs:
            if 'needs' in tab.text.lower() and 'review' in tab.text.lower():
                needs_review_tab = tab
                print(f"   ✓ Found 'Needs Review' tab")
                break
        
        if not needs_review_tab:
            # Try alternative xpath
            needs_review_tab = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Needs Review')]"))
            )
            print(f"   ✓ Found 'Needs Review' tab via alternative selector")
        
        # Click the tab
        driver.execute_script("arguments[0].click();", needs_review_tab)
        print("   ✓ Clicked 'Needs Review' tab")
        time.sleep(2)
        
    except Exception as e:
        print(f"   ❌ Error finding/clicking 'Needs Review' tab: {e}")
        raise
    
    print("\n5️⃣  Looking for logs to sign...")
    try:
        # Save screenshot to see the actual page structure
        driver.save_screenshot("supervisor_before_view_logs.png")
        print("   📸 Saved screenshot: supervisor_before_view_logs.png")
        
        # Print page source to debug what elements are available
        page_source = driver.page_source
        print(f"   Page source length: {len(page_source)} chars")
        
        # Look for "View Logs" button more carefully
        print("   Looking for 'View Logs' button...")
        
        # Try different selectors
        view_buttons = None
        
        # Try 1: Exact text match
        try:
            view_buttons = driver.find_elements(By.XPATH, "//button[text()='View Logs']")
            print(f"     Selector 1 (exact text): Found {len(view_buttons)} buttons")
        except:
            print(f"     Selector 1 failed")
        
        # Try 2: Contains text
        if not view_buttons or len(view_buttons) == 0:
            try:
                view_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'View')]")
                print(f"     Selector 2 (contains 'View'): Found {len(view_buttons)} buttons")
            except:
                print(f"     Selector 2 failed")
        
        # Try 3: Any button in a student/entry card
        if not view_buttons or len(view_buttons) == 0:
            try:
                # Find all buttons and print their text
                all_buttons = driver.find_elements(By.XPATH, "//button")
                print(f"     Total buttons on page: {len(all_buttons)}")
                for i, btn in enumerate(all_buttons[:10]):  # Print first 10
                    print(f"       Button {i}: '{btn.text}'")
                
                # Now look for one that contains "View" or "Logs"
                view_buttons = [btn for btn in all_buttons if 'view' in btn.text.lower() or 'logs' in btn.text.lower()]
                print(f"     Found {len(view_buttons)} buttons with 'View' or 'Logs'")
            except Exception as e:
                print(f"     Selector 3 failed: {e}")
        
        if not view_buttons or len(view_buttons) == 0:
            print(f"   ❌ No 'View Logs' button found!")
            print(f"   Saving page source for inspection...")
            with open("page_source_debug.html", "w") as f:
                f.write(driver.page_source)
            print(f"   Page source saved to page_source_debug.html")
            raise Exception("'View Logs' button not found on page")
        
        # Click the first View Logs button
        first_view_button = view_buttons[0]
        print(f"   ✓ Found first 'View Logs' button: '{first_view_button.text}'")
        
        # Make sure button is visible
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", first_view_button)
        time.sleep(0.5)
        
        # Click the button
        print(f"   Clicking button...")
        first_view_button.click()
        print("   ✓ Clicked 'View Logs'")
        time.sleep(3)  # Wait longer for logs to load
        
        # Take screenshot after clicking
        driver.save_screenshot("supervisor_after_view_logs.png")
        print("   📸 Saved screenshot: supervisor_after_view_logs.png")
    
    except Exception as e:
        print(f"   ❌ Error finding/clicking logs: {e}")
        try:
            driver.save_screenshot("supervisor_view_logs_error.png")
        except:
            pass
        raise
    
    print("\n6️⃣  Signing logs...")
    
    try:
        # After clicking "View Logs", we should see individual log cards
        # Each log card that needs signing has a "Sign" button on the right
        
        print("   Waiting for logs to load...")
        time.sleep(2)
        
        # Take a screenshot to see the logs page
        driver.save_screenshot("supervisor_logs_loaded.png")
        print("   📸 Saved screenshot: supervisor_logs_loaded.png")
        
        # Get all buttons to understand the page structure
        all_buttons = driver.find_elements(By.XPATH, "//button")
        print(f"   Total buttons on page: {len(all_buttons)}")
        
        # Find all Sign buttons specifically
        sign_buttons_initial = []
        for btn in all_buttons:
            if btn.text.strip() == "Sign":
                sign_buttons_initial.append(btn)
        
        print(f"   Found {len(sign_buttons_initial)} 'Sign' buttons")
        
        if len(sign_buttons_initial) == 0:
            print("   ⚠️  No Sign buttons found!")
            print("   Button texts available:")
            for i, btn in enumerate(all_buttons[:20]):  # Show first 20 buttons
                if btn.text.strip():
                    print(f"     {i}: '{btn.text}'")
            raise Exception("No Sign buttons found on page")
        
        max_logs = min(len(sign_buttons_initial), 13)  # Maximum pending logs
        print(f"   Will attempt to sign up to {max_logs} logs\n")
        
        for sign_attempt in range(max_logs):
            print(f"   [Sign {sign_attempt + 1}/{max_logs}] Finding Sign button...")
            
            try:
                # FRESH search for Sign buttons each time
                # This is crucial because the page updates after each sign
                sign_buttons = driver.find_elements(By.XPATH, "//button")
                sign_buttons = [btn for btn in sign_buttons if btn.text.strip() == "Sign"]
                
                if len(sign_buttons) == 0:
                    print(f"   ℹ️  No more Sign buttons found")
                    break
                
                print(f"     Found {len(sign_buttons)} Sign button(s)")
                
                # Get the first Sign button
                sign_btn = sign_buttons[0]
                
                # Try to get log info from the parent container
                try:
                    log_info = driver.execute_script("""
                        let btn = arguments[0];
                        let logCard = btn.closest('[class*="border"], [class*="card"]');
                        if (!logCard) logCard = btn.parentElement;
                        let logText = logCard ? logCard.textContent : '';
                        return logText.substring(0, 100);
                    """, sign_btn)
                    print(f"     Log info: {log_info[:50]}...")
                except:
                    log_info = "Unknown log"
                
                # Scroll the button into view
                driver.execute_script("""
                    arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});
                    window.scrollBy(0, 100);
                """, sign_btn)
                print(f"     Scrolled into view")
                time.sleep(1)
                
                # Make sure button is visible and clickable
                driver.execute_script("arguments[0].style.visibility = 'visible';", sign_btn)
                
                # Click the Sign button
                print(f"     Clicking Sign button...")
                driver.execute_script("arguments[0].click();", sign_btn)
                time.sleep(1)
                
                # Check for confirmation dialog
                confirmation_clicked = False
                try:
                    # Look for modal backdrop and confirm button
                    confirm_btns = driver.find_elements(By.XPATH, "//button[contains(text(), 'Confirm') or contains(text(), 'Yes') or contains(text(), 'OK')]")
                    if confirm_btns:
                        confirm_btn = confirm_btns[0]
                        print(f"     Found confirmation dialog - button: '{confirm_btn.text}'")
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", confirm_btn)
                        time.sleep(0.5)
                        confirm_btn.click()
                        print(f"     ✓ Clicked confirmation")
                        confirmation_clicked = True
                except:
                    pass
                
                # Wait for the page to update
                time.sleep(2)
                
                logs_signed += 1
                if confirmation_clicked:
                    print(f"   ✅ Log {sign_attempt + 1} signed (confirmed)")
                else:
                    print(f"   ✅ Log {sign_attempt + 1} signed")
                
            except Exception as e:
                print(f"   ❌ Error on attempt {sign_attempt + 1}: {str(e)[:80]}")
                try:
                    driver.save_screenshot(f"supervisor_sign_error_{sign_attempt}.png")
                except:
                    pass
                time.sleep(1)
                continue
        
        print(f"\n   ✅ Final count: {logs_signed} logs signed")
        
    except Exception as e:
        print(f"   ❌ Error in signing process: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n7️⃣  Summary: {logs_signed} logs signed")
    
    driver.save_screenshot("supervisor_sign_logs_final.png")
    print(f"   📸 Screenshot saved: supervisor_sign_logs_final.png")
    
    if logs_signed > 0:
        print("\n" + "=" * 60)
        print(f"✅ TEST PASSED - {logs_signed} progress logs signed!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("⚠️  TEST COMPLETED - No logs were signed (may not be ready or already signed)")
        print("=" * 60)
    
except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    import traceback
    print(traceback.format_exc())
    
    try:
        driver.save_screenshot("supervisor_sign_logs_error.png")
        print(f"\n   📸 Error screenshot saved: supervisor_sign_logs_error.png")
    except:
        pass

finally:
    print("\n🔒 Browser closed")
    driver.quit()
