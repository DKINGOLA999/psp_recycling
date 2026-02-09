let userId = null;
let verificationModal = null;

document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    password: f.password.value,
    houseNumber: f.houseNumber.value.trim(),
    street: f.street.value.trim(),
    state: f.state.value.trim(),
    country: f.country.value.trim()
  };
  // include userType
  data.userType = f.userType.value;
  // basic client-side validation
  if (!data.name || !data.email || !data.password || data.password.length < 6) {
    document.getElementById('msg').textContent = 'Please complete all fields and use a password of at least 6 characters';
    return;
  }
  try{
    const res = await apiFetch('/public/register', { method: 'POST', body: data });
    document.getElementById('msg').textContent = res.message || 'Verification code sent to your email';
    
    // Store userId for verification
    userId = res.userId;
    
    // Show verification modal
    verificationModal = new bootstrap.Modal(document.getElementById('verificationModal'));
    verificationModal.show();
    
    // Focus first input after modal is shown
    document.getElementById('verificationModal').addEventListener('shown.bs.modal', function () {
      document.getElementById('digit1').focus();
    }, { once: true });
    
  } catch(err){
    document.getElementById('msg').textContent = err?.message || err?.error || 'Registration failed';
  }
});

// Auto-focus next input on digit entry and handle backspace
document.querySelectorAll('.verification-input').forEach((input, index) => {
  input.addEventListener('input', (e) => {
    const value = e.target.value;
    
    // Only allow digits
    e.target.value = value.replace(/[^0-9]/g, '');
    
    // Add focus styling
    if (e.target.value) {
      e.target.style.borderColor = '#0d6efd';
      e.target.style.borderWidth = '2px';
    } else {
      e.target.style.borderColor = '#dee2e6';
      e.target.style.borderWidth = '2px';
    }
    
    // Move to next input if digit entered
    if (e.target.value.length === 1 && index < 3) {
      document.getElementById(`digit${index + 2}`).focus();
    }
  });
  
  // Handle backspace
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      if (e.target.value === '' && index > 0) {
        // Move to previous input if current is empty
        document.getElementById(`digit${index}`).focus();
      } else {
        // Clear current input
        e.target.value = '';
        e.target.style.borderColor = '#dee2e6';
      }
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
        for (let i = 0; i < digits.length && i < 4; i++) {
          document.getElementById(`digit${i + 1}`).value = digits[i];
          document.getElementById(`digit${i + 1}`).style.borderColor = '#0d6efd';
        }
        if (digits.length > 0) {
          document.getElementById(`digit${Math.min(digits.length, 4)}`).focus();
        }
      });
    }
  });
  
  // Add focus styling
  input.addEventListener('focus', (e) => {
    e.target.style.borderColor = '#0d6efd';
  });
  
  input.addEventListener('blur', (e) => {
    if (!e.target.value) {
      e.target.style.borderColor = '#dee2e6';
    }
  });
});

// Verify button
document.getElementById('verifyBtn').addEventListener('click', async () => {
  const digit1 = document.getElementById('digit1').value;
  const digit2 = document.getElementById('digit2').value;
  const digit3 = document.getElementById('digit3').value;
  const digit4 = document.getElementById('digit4').value;
  
  const code = digit1 + digit2 + digit3 + digit4;
  
  if (code.length !== 4) {
    document.getElementById('verifyMsg').textContent = 'Please enter all 4 digits';
    document.getElementById('verifyMsg').className = 'text-center mb-3 text-danger fw-bold';
    return;
  }
  
  // Disable button while verifying
  const verifyBtn = document.getElementById('verifyBtn');
  const originalText = verifyBtn.textContent;
  verifyBtn.disabled = true;
  verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Verifying...';
  
  try {
    const res = await apiFetch('/public/verify-email', { 
      method: 'POST', 
      body: { userId, code } 
    });
    
    document.getElementById('verifyMsg').textContent = res.message || 'Email verified successfully!';
    document.getElementById('verifyMsg').className = 'text-center mb-3 text-success fw-bold';
    
    // Mark all inputs as success
    document.querySelectorAll('.verification-input').forEach(input => {
      input.style.borderColor = '#198754';
      input.disabled = true;
    });
    
    // Disable resend button
    document.getElementById('resendBtn').disabled = true;
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
    
  } catch(err) {
    document.getElementById('verifyMsg').textContent = err?.error || 'Verification failed. Please try again.';
    document.getElementById('verifyMsg').className = 'text-center mb-3 text-danger fw-bold';
    
    // Mark all inputs as error
    document.querySelectorAll('.verification-input').forEach(input => {
      input.style.borderColor = '#dc3545';
    });
    
    // Clear inputs on error
    document.querySelectorAll('.verification-input').forEach(input => {
      input.value = '';
      setTimeout(() => {
        input.style.borderColor = '#dee2e6';
      }, 1500);
    });
    document.getElementById('digit1').focus();
    
    // Re-enable button
    verifyBtn.disabled = false;
    verifyBtn.textContent = originalText;
  }
});

// Resend button
document.getElementById('resendBtn').addEventListener('click', async () => {
  const resendBtn = document.getElementById('resendBtn');
  const originalText = resendBtn.textContent;
  resendBtn.disabled = true;
  resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';
  
  try {
    const res = await apiFetch('/public/resend-verification', { 
      method: 'POST', 
      body: { userId } 
    });
    
    document.getElementById('verifyMsg').textContent = res.message || 'New code sent to your email!';
    document.getElementById('verifyMsg').className = 'text-center mb-3 text-success fw-bold';
    
    // Clear inputs
    document.querySelectorAll('.verification-input').forEach(input => {
      input.value = '';
      input.style.borderColor = '#dee2e6';
    });
    document.getElementById('digit1').focus();
    
    // Re-enable button after 5 seconds
    setTimeout(() => {
      resendBtn.disabled = false;
      resendBtn.textContent = originalText;
    }, 5000);
    
  } catch(err) {
    document.getElementById('verifyMsg').textContent = err?.error || 'Failed to resend code. Please try again.';
    document.getElementById('verifyMsg').className = 'text-center mb-3 text-danger fw-bold';
    
    resendBtn.disabled = false;
    resendBtn.textContent = originalText;
  }
});
