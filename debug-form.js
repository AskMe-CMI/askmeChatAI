// Debug script to detect form submissions
// Paste this in browser console to detect any form submissions

console.log('🔍 Setting up form submission detection...');

// Override form submit
const originalSubmit = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function (...args) {
  console.log('🚨 FORM SUBMIT DETECTED:', {
    form: this,
    action: this.action,
    method: this.method,
    elements: Array.from(this.elements).map((el) => ({
      tag: el.tagName,
      name: el.name,
      value: el.value,
    })),
  });
  return originalSubmit.apply(this, args);
};

// Listen for submit events
document.addEventListener(
  'submit',
  (e) => {
    console.log('🚨 SUBMIT EVENT:', {
      target: e.target,
      action: e.target.action,
      method: e.target.method,
      preventDefault: e.defaultPrevented,
    });
  },
  true,
);

// Override fetch
const originalFetch = window.fetch;
window.fetch = function (url, options, ...args) {
  if (options && options.method === 'POST') {
    console.log('🚨 FETCH POST:', { url, options });
  }
  return originalFetch.apply(this, [url, options, ...args]);
};

console.log('✅ Form detection setup complete!');
