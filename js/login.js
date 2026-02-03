const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwpNHHEOzD-2Rh7DiMb6_ZGPPfYBgpNqH3K9M2IqwXKtue2Y5UY0GkD1v-Jzf2jpZAm7Q/exec';

document.addEventListener('DOMContentLoaded', () => {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const submitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const authMsg = document.getElementById('auth-msg');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const resetEmailInput = document.getElementById('reset-email');
  const otpInput = document.getElementById('otp-input');
  const newPasswordInput = document.getElementById('new-password-input');
  const resetSubmitBtn = document.getElementById('reset-submit-btn');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const updatePasswordBtn = document.getElementById('update-password-btn');
  const backToLoginLink = document.getElementById('back-to-login');
  let isLogin = true;
  let resetEmail = '';

  // 🔁 Tab switch
  loginTab.addEventListener('click', () => {
    isLogin = true;
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    submitBtn.textContent = 'Login';
    authMsg.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  registerTab.addEventListener('click', () => {
    isLogin = false;
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    submitBtn.textContent = 'Register';
    authMsg.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  // Forgot Password link
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    forgotPasswordForm.style.display = 'block';
    authMsg.style.display = 'none';
    // Show email input initially
    resetEmailInput.style.display = 'block';
    otpInput.style.display = 'none';
    newPasswordInput.style.display = 'none';
    resetSubmitBtn.style.display = 'inline-block';
    verifyOtpBtn.style.display = 'none';
    updatePasswordBtn.style.display = 'none';
  });

  // Back to Login
  backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordForm.style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  });

  // 🚀 Form submit (Login/Register)
  document
    .getElementById('login-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      // ✅ Basic client-side validation for faster feedback
      if (!email || !password) {
        authMsg.textContent = 'Please fill in all fields.';
        authMsg.style.display = 'block';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        authMsg.textContent = 'Please enter a valid email.';
        authMsg.style.display = 'block';
        return;
      }
      if (password.length < 6) {
        authMsg.textContent = 'Password must be at least 6 characters.';
        authMsg.style.display = 'block';
        return;
      }

      const action = isLogin ? 'login' : 'register';
      authMsg.style.display = 'none';

      // ✅ Disable button to prevent multiple submissions (faster UX)
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            action: action,
            email: email,
            password: password
          })
        });

        const result = await response.json();

        if (result.success) {
          localStorage.setItem(
            'loggedInUser',
            JSON.stringify({
              userId: result.userId,
              courses: result.courses || []
            })
          );

          // ✅ Redirect
          window.location.href = 'index.html';
        } else {
          authMsg.textContent = result.message || 'Authentication failed';
          authMsg.style.display = 'block';
        }
      } catch (error) {
        console.error('Network error:', error);
        authMsg.textContent = 'Network error. Please try again.';
        authMsg.style.display = 'block';
      } finally {
        // ✅ Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Login' : 'Register';
      }
    });

  // 🚀 Forgot Password: Send OTP
  resetSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    resetEmail = resetEmailInput.value.trim();

    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      authMsg.textContent = 'Please enter a valid email.';
      authMsg.style.display = 'block';
      return;
    }

    authMsg.style.display = 'none';
    resetSubmitBtn.disabled = true;
    resetSubmitBtn.textContent = 'Sending...';

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          action: 'resetPassword',
          email: resetEmail
        })
      });

      const result = await response.json();

      if (result.success) {
        authMsg.textContent = 'OTP sent to your email.';
        authMsg.style.color = 'green';
        authMsg.style.display = 'block';
        // Show OTP input
        resetEmailInput.style.display = 'none';
        otpInput.style.display = 'block';
        resetSubmitBtn.style.display = 'none';
        verifyOtpBtn.style.display = 'inline-block';
      } else {
        authMsg.textContent = result.message || 'Failed to send OTP.';
        authMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('Network error:', error);
      authMsg.textContent = 'Network error. Please try again.';
      authMsg.style.display = 'block';
    } finally {
      resetSubmitBtn.disabled = false;
      resetSubmitBtn.textContent = 'Send OTP';
    }
  });

  // 🚀 Verify OTP
  verifyOtpBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const otp = otpInput.value.trim();

    if (!otp) {
      authMsg.textContent = 'Please enter OTP.';
      authMsg.style.display = 'block';
      return;
    }

    authMsg.style.display = 'none';
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying...';

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          action: 'verifyOTP',
          email: resetEmail,
          otp: otp
        })
      });

      const result = await response.json();

      if (result.success) {
        authMsg.textContent = 'OTP verified. Enter new password.';
        authMsg.style.color = 'green';
        authMsg.style.display = 'block';
        // Show new password input
        otpInput.style.display = 'none';
        newPasswordInput.style.display = 'block';
        verifyOtpBtn.style.display = 'none';
        updatePasswordBtn.style.display = 'inline-block';
      } else {
        authMsg.textContent = result.message || 'Invalid OTP.';
        authMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('Network error:', error);
      authMsg.textContent = 'Network error. Please try again.';
      authMsg.style.display = 'block';
    } finally {
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = 'Verify OTP';
    }
  });

  // 🚀 Update Password
  updatePasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value.trim();

    if (!newPassword || newPassword.length < 6) {
      authMsg.textContent = 'Password must be at least 6 characters.';
      authMsg.style.display = 'block';
      return;
    }

    authMsg.style.display = 'none';
    updatePasswordBtn.disabled = true;
    updatePasswordBtn.textContent = 'Updating...';

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          action: 'updatePassword',
          email: resetEmail,
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        authMsg.textContent = 'Password updated successfully. You can now login.';
        authMsg.style.color = 'green';
        authMsg.style.display = 'block';
        // Reset form
        setTimeout(() => {
          forgotPasswordForm.style.display = 'none';
          document.getElementById('login-form').style.display = 'block';
        }, 2000);
      } else {
        authMsg.textContent = result.message || 'Failed to update password.';
        authMsg.style.display = 'block';
      }
    } catch (error) {
      console.error('Network error:', error);
      authMsg.textContent = 'Network error. Please try again.';
      authMsg.style.display = 'block';
    } finally {
      updatePasswordBtn.disabled = false;
      updatePasswordBtn.textContent = 'Update Password';
    }
  });
});