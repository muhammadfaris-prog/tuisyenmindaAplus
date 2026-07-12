"""
Zool Tuisyen System — Playwright E2E Test
Tests admin student registration flow and identifies issues.
"""
import json, sys, os
from playwright.sync_api import sync_playwright

BASE_URL = 'https://muhammadfaris-prog.github.io/tuisyenmindaAplus'
LOCAL_HTML = r'G:\My Drive\UiTM PP ADMIN WORK\Zool Tuisyen System\index.html'

def run_tests():
    results = {'passed': [], 'failed': [], 'warnings': []}
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        
        # Collect console errors
        console_errors = []
        page.on('console', lambda msg: 
            console_errors.append(f'[{msg.type}] {msg.text}') if msg.type in ('error', 'warning') else None)
        
        try:
            # ============ TEST 1: Page loads ============
            print('TEST 1: Page loads correctly')
            page.goto(BASE_URL, wait_until='networkidle', timeout=15000)
            title = page.title()
            assert 'Minda A+' in title, f'Wrong title: {title}'
            results['passed'].append('Page loads with correct title')
            print(f'  OK Page title: {title}')
            
            # ============ TEST 2: Navigation ============
            print('TEST 2: Navigation between portals')
            page.click('button:has-text("Admin")')
            page.wait_for_timeout(500)
            assert page.locator('h2:has-text("Akses Admin")').is_visible(), 'Admin login not visible'
            results['passed'].append('Admin portal accessible')
            print('  ✅ Admin portal loads')
            
            page.click('button:has-text("Ibu Bapa")')
            page.wait_for_timeout(500)
            assert page.locator('h2:has-text("Portal Ibu Bapa")').is_visible(), 'Parent portal not visible'
            results['passed'].append('Parent portal accessible')
            print('  ✅ Parent portal loads')
            
            # ============ TEST 3: Parent lookup (GET - should work) ============
            print('TEST 3: Parent portal student lookup (GET request)')
            page.fill('#parent-ic', '800101011234')
            page.click('button:has-text("Semak")')
            page.wait_for_timeout(3000)
            
            # Check if student info appeared
            student_info = page.locator('#student-info')
            if student_info.is_visible():
                name = page.locator('#info-name').text_content()
                if name and name != '':
                    results['passed'].append(f'Parent lookup works (GET request): found "{name}"')
                    print(f'  ✅ Student found: {name}')
                else:
                    results['warnings'].append('Parent lookup returned but name is empty')
                    print('  ⚠️ Student card visible but name is empty')
            else:
                results['warnings'].append('Parent lookup: student info did not appear')
                print('  ⚠️ Student info card did not appear')
            
            # ============ TEST 4: Admin login ============
            print('TEST 4: Admin login')
            page.click('button:has-text("Admin")')
            page.wait_for_timeout(500)
            page.fill('#admin-password', 'zool123')
            page.click('button:has-text("Log Masuk")')
            page.wait_for_timeout(3000)
            
            # Check console for CORS errors
            cors_errors = [e for e in console_errors if 'CORS' in e or 'Failed to fetch' in e]
            if cors_errors:
                results['failed'].append(f'CORS blocks admin API calls: {len(cors_errors)} errors')
                print(f'  ❌ CORS errors detected: {len(cors_errors)}')
                for e in cors_errors[:3]:
                    print(f'     {e[:120]}...')
            else:
                results['passed'].append('No CORS errors during admin login')
                print('  ✅ No CORS errors')
            
            # ============ TEST 5: Student list loading ============
            print('TEST 5: Student list loading')
            students_container = page.locator('#students-list')
            students_text = students_container.text_content() if students_container.is_visible() else ''
            
            if 'Memuatkan' in students_text:
                results['failed'].append('Student list stuck on "Memuatkan..." (CORS blocks listStudents)')
                print('  ❌ Student list stuck loading — CORS blocks listStudents POST')
            elif 'Ralat' in students_text:
                results['warnings'].append(f'Student list shows error: {students_text[:80]}')
                print(f'  ⚠️ Student list error: {students_text[:80]}')
            elif 'Tiada pelajar' in students_text:
                results['passed'].append('Student list loaded (empty - no students)')
                print('  ✅ Student list loaded (empty)')
            else:
                # Maybe students are displayed
                student_cards = page.locator('#students-list > div').count()
                results['passed'].append(f'Student list loaded with {student_cards} students')
                print(f'  ✅ Student list loaded: {student_cards} students')
            
            # ============ TEST 6: Check student form elements ============
            print('TEST 6: Student registration form elements')
            form_elements = ['a-parentIC', 'a-parentName', 'a-parentPhone', 'a-studentName', 'a-schoolLevel', 'a-regFee']
            all_present = True
            for elem_id in form_elements:
                if not page.locator(f'#{elem_id}').is_visible():
                    results['failed'].append(f'Form element #{elem_id} missing')
                    print(f'  ❌ Missing: #{elem_id}')
                    all_present = False
            if all_present:
                results['passed'].append('All student form elements present')
                print('  ✅ All form elements present')
            
            # ============ TEST 7: Screenshot current state ============
            print('TEST 7: Taking diagnostic screenshot')
            screenshot_path = os.path.join(os.path.dirname(__file__), 'test-screenshot.png')
            page.screenshot(path=screenshot_path, full_page=True)
            results['passed'].append(f'Screenshot saved to {screenshot_path}')
            print(f'  ✅ Screenshot saved: {screenshot_path}')
            
            # ============ SUMMARY ============
            print('\n' + '='*60)
            print('TEST SUMMARY')
            print('='*60)
            all_console = [e for e in console_errors if 'cdn.tailwindcss' not in e]
            if all_console:
                print(f'\nConsole errors/warnings ({len(all_console)}):')
                for e in all_console[:10]:
                    print(f'  {e[:150]}')
            
            print(f'\nResults: {len(results["passed"])} passed, {len(results["failed"])} failed, {len(results["warnings"])} warnings')
            
            for test in results['passed']:
                print(f'  ✅ {test}')
            for test in results['warnings']:
                print(f'  ⚠️ {test}')
            for test in results['failed']:
                print(f'  ❌ {test}')
            
        except Exception as e:
            results['failed'].append(f'Test exception: {str(e)}')
            print(f'\n  ❌ EXCEPTION: {e}')
            # Take error screenshot
            error_path = os.path.join(os.path.dirname(__file__), 'test-error.png')
            page.screenshot(path=error_path, full_page=True)
        
        finally:
            browser.close()
    
    return results

if __name__ == '__main__':
    results = run_tests()
    sys.exit(1 if results['failed'] else 0)
