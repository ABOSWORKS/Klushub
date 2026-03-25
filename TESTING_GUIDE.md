# 🧪 TESTING GUIDE - Email Notification System

**Status:** Ready for testing
**Test Types:** Automated (Playwright) + Manual verification + Direct API tests
**Date:** 2026-03-25

---

## 🎯 WHAT TO TEST

All 4 email triggers should work:

1. ✅ **job_posted** — Customer posts job → Email sent
2. ✅ **bid_received** — Contractor submits bid → Email sent to customer
3. ✅ **bid_accepted** — Customer accepts bid → Email sent to contractor
4. ✅ **review_posted** — Customer reviews contractor → Email sent

---

## 🧪 HOW TO TEST

### Option 1: Quick Manual Test (EASIEST - 5 minutes)

**Just use the website normally:**

1. Go to: https://your-klushub-site.com
2. Post a test job (fill in form, submit)
3. Check your email (look for Klushub email)
4. Repeat for bid, acceptance, review

**Expected:** Email arrives within 2 minutes

---

### Option 2: Automated Testing with curl (10 minutes)

**Run quick test script:**

```bash
# Set your Supabase credentials
export SUPABASE_URL=https://mzozea yfubnocddrt5fk.supabase.co
export SUPABASE_KEY=your-anon-key-here

# Run tests
bash tests/quick-test.sh
```

**Expected output:** 4 successful API responses

---

### Option 3: Playwright Automated Tests (Advanced)

**Install dependencies:**
```bash
npm install -D @playwright/test
```

**Run tests:**
```bash
npx playwright test tests/email-notifications.spec.ts
```

**Expected:** All tests pass or show success

---

## ✅ MANUAL VERIFICATION CHECKLIST

### Email Content Verification

**For each email received, check:**

#### Job Posted Email
- [ ] Subject: "🎉 Je klus is geplaatst op Klushub!"
- [ ] Contains job title
- [ ] Has "Beheer je klus" button/link
- [ ] Klushub branding visible (blue/yellow colors)
- [ ] Professional formatting

#### Bid Received Email
- [ ] Subject: "💰 Nieuwe aanbieding van [contractor name]!"
- [ ] Shows contractor name
- [ ] Shows bid amount (€)
- [ ] Has "Bekijk aanbieding" link
- [ ] Professional formatting

#### Bid Accepted Email
- [ ] Subject: "🎊 Je bent gekozen! Nieuw project wacht!"
- [ ] Shows customer name
- [ ] Shows job title
- [ ] Shows start date
- [ ] Congratulations message

#### Review Posted Email
- [ ] Subject: "⭐ Je hebt een review gekregen!"
- [ ] Shows star rating (⭐⭐⭐⭐⭐)
- [ ] Shows review text
- [ ] Shows job title
- [ ] Professional layout

### Delivery Verification

- [ ] All emails arrive within 2 minutes
- [ ] Emails are in inbox (not spam)
- [ ] Sender is "Klushub <onboarding@resend.dev>"
- [ ] All links are clickable
- [ ] No broken images or formatting

---

## 🐛 TROUBLESHOOTING

### Problem: Emails not arriving

**Checklist:**
- [ ] Check spam/junk folder
- [ ] Check email was typed correctly
- [ ] Check that form submitted successfully (green modal appeared)
- [ ] Wait 5 minutes (Resend can be slightly delayed)
- [ ] Check browser console for errors (F12 → Console)

### Problem: Email formatting broken

**Check:**
- [ ] Is this a Gmail, Outlook, or other provider?
- [ ] Try forwarding email to another address
- [ ] Check Resend dashboard logs for issues

### Problem: Email function returning errors

**Check console (F12):**
```
Look for error messages like:
- "RESEND_API_KEY not configured" → Secret not saved
- "Invalid email type" → Bug in code
- "Email service not configured" → Supabase secret missing
```

---

## 📊 TEST RESULTS TEMPLATE

**Date:** ___________
**Tester:** ___________

### Results

| Email Type | Status | Arrived | Formatted | Notes |
|-----------|--------|---------|-----------|-------|
| job_posted | ✅/❌ | ✅/❌ | ✅/❌ | |
| bid_received | ✅/❌ | ✅/❌ | ✅/❌ | |
| bid_accepted | ✅/❌ | ✅/❌ | ✅/❌ | |
| review_posted | ✅/❌ | ✅/❌ | ✅/❌ | |

### Overall Status
- [ ] All 4 email types working ✅ PRODUCTION READY
- [ ] Some issues found 🟡 NEEDS FIXING
- [ ] Critical errors 🔴 NOT READY

---

## 📋 EDGE CASE TESTS (Optional)

### Test invalid inputs
- [ ] Submit with invalid email format → Should show error
- [ ] Submit empty form → Should show validation error
- [ ] Submit with very long text → Should format correctly

### Test network scenarios
- [ ] Test on slow connection (throttle in DevTools)
- [ ] Test with VPN
- [ ] Test on mobile (iPhone/Android)

### Test concurrent requests
- [ ] Submit multiple jobs quickly
- [ ] Submit multiple bids
- [ ] All should trigger emails correctly

---

## 🎉 SUCCESS CRITERIA

Email system is **PRODUCTION READY** when:

✅ All 4 email types arrive successfully
✅ Emails are properly formatted with Klushub branding
✅ All links are clickable and working
✅ Emails arrive within 2 minutes
✅ No emails in spam folder
✅ No console errors
✅ Works on multiple email providers (Gmail, Outlook, etc.)
✅ Mobile rendering looks good

---

## 📞 IF TESTS FAIL

1. Check Supabase Edge Function logs
   - Dashboard → Edge Functions → resend-email → Logs

2. Check Resend logs
   - Resend Dashboard → Logs section

3. Check browser console errors (F12 → Console)

4. Verify:
   - RESEND_API_KEY secret is saved
   - Edge Function is deployed
   - index.html has email triggers

---

## 📝 LOGGING RESULTS

After running tests, please record:
- ✅ Tests passed
- 🐛 Any bugs found
- 📊 Performance (email arrival time)
- 🔧 Any fixes needed

---

**System Status: READY FOR TESTING** 🚀
