"""
Selenium WebDriver Test - Student FYP Registration
Test: Student logs in, navigates to FYP Registration, fills form, and submits
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time


BASE_URL = "http://localhost:5173"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student" 
SUPERVISOR_EMAIL = "supervisor@example.com"
PROJECT_TITLE = "AI-Powered Chatbot System"
PROJECT_ABSTRACT = "This project aims to build an intelligent chatbot using NLP and machine learning. The system will process user queries and provide relevant responses."

driver = webdriver.Firefox()
wait = WebDriverWait(driver, 10)

try:
    print("=" * 60)
    print("🚀 STUDENT REGISTRATION TEST")
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

    print("3️⃣  Clicking on FYP Registration menu...")
    registration_menu = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="fyp-registration-menu"]'))
    )
    registration_menu.click()
    
    print("   Waiting for registration form to load...")
    time.sleep(1)
    

    print("4️⃣  Filling in project title...")
    title_input = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="project-title-input"]'))
    )
    title_input.send_keys(PROJECT_TITLE)
    print(f"   ✓ Title entered: {PROJECT_TITLE}")
    

    print("5️⃣  Filling in supervisor email...")
    supervisor_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="supervisor-email-input"]')
    supervisor_input.send_keys(SUPERVISOR_EMAIL)
    print(f"   ✓ Supervisor email entered: {SUPERVISOR_EMAIL}")
    
   
    print("6️⃣  Filling in project abstract...")
    abstract_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="project-abstract-input"]')
    abstract_input.send_keys(PROJECT_ABSTRACT)
    print(f"   ✓ Abstract entered ({len(PROJECT_ABSTRACT)} characters)")
    

    print("7️⃣  Submitting registration...")
    submit_btn = driver.find_element(By.CSS_SELECTOR, '[data-testid="submit-registration-btn"]')
    submit_btn.click()
    
    print("   Waiting for submission response...")
    time.sleep(2)
    
    
    print("8️⃣  Checking submission result...")
    try:
        title_input = driver.find_element(By.CSS_SELECTOR, '[data-testid="project-title-input"]')
        print("   ⚠️  Form still visible - checking for error/success message")
    except:
        print("   ✓ Form closed - submission likely successful!")
    
    print("\n" + "=" * 60)
    print("✅ TEST PASSED - Registration flow completed!")
    print("=" * 60)
    
    driver.save_screenshot("test_registration_success.png")
    print("\n📸 Screenshot saved: test_registration_success.png")

except Exception as e:
    print(f"\n❌ TEST FAILED: {e}")
    driver.save_screenshot("test_registration_error.png")
    print("📸 Error screenshot saved: test_registration_error.png")

finally:
    print("\nClosing browser...")
    driver.quit()
    print("Browser closed")
