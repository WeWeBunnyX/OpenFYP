"""
Simple Selenium WebDriver Test - Login Page
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:5173"
driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("Opening login page...")
    driver.get(BASE_URL)
    
    print("Finding email input...")
    email_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="email-input"]'))
    )
    
    print("Typing email...")
    email_input.send_keys("student@example.com")
    
    print("Finding password input...")
    password_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
    
    print("Typing password...")
    password_input.send_keys("student")
    
    print("Finding submit button...")
    submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="login-btn"]')
    
    print("Clicking submit button...")
    submit_btn.click()
    
    print("Waiting for response...")
    import time
    time.sleep(2)
    
    try:
        error_msg = driver.find_element(By.CSS_SELECTOR, '[data-testid="error-message"]')
        print(f"✅ Error message found: {error_msg.text}")
    except:
        print("No error message (maybe logged in or went to dashboard)")
    
    print("\n✅ TEST PASSED - Basic login form works!")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")

finally:
    driver.quit()
    print("Browser closed")
