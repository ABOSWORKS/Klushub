# 🚀 SETUP GUIDE: Supabase Edge Function + Resend Email Integration

**Status:** Ready for deployment
**Time Required:** 10 minutes
**Difficulty:** Easy (copy-paste steps)

---

## ✅ WHAT YOU NEED

- ✅ Supabase Project (you already have this)
- ✅ Resend API Key: `re_LkV8s2gb_2znfuhgqB1c1QUFJCg5YtR`
- ✅ Edge Function Code (provided in `SUPABASE_EDGE_FUNCTION_send_notification_email.ts`)

---

## 📋 STEP-BY-STEP DEPLOYMENT

### STEP 1: Open Supabase Dashboard
```
1. Go to: https://supabase.com/dashboard
2. Login with your account
3. Select your Klushub project
```

### STEP 2: Create Edge Function
```
1. In left sidebar, click: "Edge Functions"
2. Click blue button: "Create a new function"
3. Name it: send-notification-email
4. Select template: HTTP (or empty)
5. Click: Create function
```

### STEP 3: Paste Code
```
1. You'll see an editor with example code
2. Select ALL the code (Ctrl+A)
3. Delete it
4. Open file: SUPABASE_EDGE_FUNCTION_send_notification_email.ts
5. Copy ALL the code from that file
6. Paste into the Supabase editor
7. Click: Save
```

**Important:** If you get a popup about dependencies, click "Install dependencies" → wait for it to finish

### STEP 4: Add Resend API Key as Secret
```
1. In the Edge Function editor, click: "Configuration" or "Settings"
2. Look for section: "Secrets" or "Environment Variables"
3. Click: "Add secret"
4. Name: RESEND_API_KEY
5. Value: re_LkV8s2gb_2znfuhgqB1c1QUFJCg5YtR
6. Click: Save secret
```

**Screenshot guide:**
- Secrets section is usually on the right side panel
- Format: `RESEND_API_KEY` = `re_LkV8s2gb_...`

### STEP 5: Deploy
```
1. Click: "Deploy" button (usually blue, top right)
2. Wait for confirmation message
3. You should see: "✓ Function deployed successfully"
```

### STEP 6: Verify Deployment
```
1. You'll see a URL like: https://your-project.supabase.co/functions/v1/send-notification-email
2. Copy this URL (you might need it for testing)
3. Function is now LIVE ✅
```

---

## 🧪 QUICK TEST (Optional but Recommended)

### Test in Browser Console:
```javascript
// Open Klushub website
// Press F12 (DevTools)
// Go to Console tab
// Paste this:

sb.functions.invoke('send-notification-email', {
  body: {
    type: 'job_posted',
    recipient_email: 'your-email@example.com',  // Change this to your email
    data: {
      job_title: 'Test Job - Email System Working!',
      manage_link: 'https://example.com/test',
      view_link: 'https://example.com/test'
    }
  }
}).then(res => {
  console.log('✅ Email function works:', res)
  alert('Email sent! Check your inbox in 30 seconds.')
}).catch(err => {
  console.error('❌ Error:', err)
  alert('Error: ' + err.message)
})
```

**Expected Result:**
- Console shows: `✅ Email function works: { success: true, messageId: '...' }`
- You receive an email within 30 seconds

---

## ⚠️ TROUBLESHOOTING

### Problem 1: "Function not found" error
**Solution:**
- Wait 30 seconds after deploying
- Refresh the Klushub website
- Try again

### Problem 2: "RESEND_API_KEY not configured"
**Solution:**
- Go back to Edge Function settings
- Make sure secret is named EXACTLY: `RESEND_API_KEY`
- Value should be: `re_LkV8s2gb_2znfuhgqB1c1QUFJCg5YtR`
- Redeploy function

### Problem 3: Email not received
**Solution:**
- Check SPAM folder (add to contacts if found)
- Check that recipient email is correct
- Try Resend test domain: `onboarding@resend.dev`
- Check Resend dashboard for error logs

### Problem 4: Syntax errors in editor
**Solution:**
- Make sure you copied the ENTIRE file
- Check for missing braces or quotes
- Try deleting and re-pasting the code

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify these work:

- [ ] Edge Function deployed (see checkmark in Supabase)
- [ ] Secret `RESEND_API_KEY` added and saved
- [ ] Test email sent successfully
- [ ] Email received in inbox within 1 minute
- [ ] Click link in email (should work)
- [ ] No console errors when submitting job form

---

## 📊 WHAT HAPPENS NEXT

Once Edge Function is deployed:

1. **Klushub will automatically:**
   - Send email when customer posts job ✅
   - Send email when contractor bids ✅
   - Send email when bid is accepted ✅
   - Send email when review is posted ✅

2. **Everything is handled by:**
   - Front-end: index.html (already updated)
   - Back-end: Edge Function (you just deployed)
   - Email service: Resend (via API key)

3. **No additional setup needed:**
   - HTML emails with branding ✅
   - Error handling ✅
   - Fallback if service down ✅

---

## 🎯 SUCCESS INDICATORS

**You'll know it's working when:**

1. ✅ No console errors in browser
2. ✅ Emails arrive within 60 seconds
3. ✅ Email templates look professional
4. ✅ Links in emails are clickable
5. ✅ All 4 email types work (job_posted, bid_received, bid_accepted, review_posted)

---

## 📞 SUPPORT

**If something goes wrong:**
1. Check Supabase Edge Functions logs (click function → View logs)
2. Check Resend API logs (Resend dashboard → Logs)
3. Check browser console (F12 → Console)
4. All errors are logged with descriptions

---

**That's it! You're done. Everything else is automated.** 🎉

Once this is deployed, all emails work automatically. No more configuration needed.
