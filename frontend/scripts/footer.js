// Inject a consistent footer across all pages
(function(){
  const footer = document.createElement('footer');
  footer.className = 'site-footer mt-5 py-4';
  footer.innerHTML = `
    <div class="container">
      <div class="row">
        <div class="col-md-4 mb-3">
          <h5 class="text-white">Sigma Recycling</h5>
          <p class="text-white small">We provide reliable waste collection and recycling services. Help protect the environment by recycling with us.</p>
        </div>
        <div class="col-md-4 mb-3 text-white small">
          <h6>Contact</h6>
          <div>Email: <a href="mailto:davidolawore6@gmail.com">davidolawore6@gmail.com</a></div>
          <div>Phone: <a href="tel:+2348023991084">+234-802-399-1084</a></div>
          <div class="mt-2">Address: 12 Recycling Ave, Lagos, Nigeria</div>
        </div>
        <div class="col-md-4 mb-3 text-white small">
          <h6>Quick links</h6>    
          <div><a href="about.html">About</a></div>
          <div><a href="/profile.html">Profile</a></div>
          <div><a href="/payments.html">Payments</a></div>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-white small">© ${new Date().getFullYear()} Sigma Recycling Company</div>
        <div class="small text-white">Built with care • <span class="muted">Privacy & Terms</span></div>
      </div>
    </div>
  `;
  // append before end of body
  document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(footer);

  // floating back button to dashboard (small circular)
  const back = document.createElement('a');
  // default target for non-admin users/pages
  back.href = '/dashboard.html';
  back.className = 'btn back-btn';
  back.title = 'Back to dashboard';
  back.innerHTML = '<span aria-hidden="true">\u2190</span>';
  document.body.appendChild(back);

  // If we're on an admin page (filename contains 'admin' _or_ the signed-in user is an admin),
  // make the back button return to the admin dashboard instead.
  (function setBackForAdmin(){
    try{
      const path = (window.location.pathname || '').toLowerCase();
      // simple filename check: admin pages use names like admin_dashboard.html, admin_users.html, etc.
      if (path.includes('admin_') || path.endsWith('admin_dashboard.html') || path.includes('/admin')){
        back.href = '/admin_dashboard.html';
        return;
      }
      // fallback: if apiFetch exists, check the user's role
      if (typeof window.apiFetch === 'function'){
        window.apiFetch('/user/profile').then(res => {
          if (res && res.user && res.user.role === 'admin') back.href = '/admin_dashboard.html';
        }).catch(() => {/* ignore */});
      }
    }catch(e){ /* ignore errors */ }
  })();

  // Try to show logged-in user's name in the navbar (if any)
    // Uses the global apiFetch helper; fail silently if not authenticated or apiFetch missing
    (async function showUserBadge(){
      try {
        if (typeof window.apiFetch !== 'function') return;
        const res = await window.apiFetch('/user/profile');
        const user = res && res.user;
        if (!user || !user.name) return;
        const navContainer = document.querySelector('.navbar .container') || document.querySelector('.navbar');
        if (!navContainer) return;
        // create badge/link to profile
        const badge = document.createElement('a');
        badge.href = '/profile.html';
        badge.className = 'ms-3 btn btn-sm btn-outline-primary';
        badge.innerText = user.name;
        // insert at end of nav container's right side (after existing elements)
        navContainer.appendChild(badge);
      } catch (e) {
        // ignore — not logged in or API error
      }
    })();
  });
})();
