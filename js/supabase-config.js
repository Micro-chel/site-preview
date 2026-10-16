(function () {
  var path = (window.location.pathname || '').replace(/\\/g, '/');
  window.AVELIS_ROOT = (document.currentScript && document.currentScript.src || '').replace(/js\/supabase-config\.js.*$/, ''); // absolute: works for /, /preparaty/, /blog/ and /ru/... pages
})();

window.AVELIS_SITE_URL = 'https://avelis.clinic';
window.AVELIS_SUPABASE_URL = 'https://gtkwosfqfahgwrkcipjv.supabase.co';
window.AVELIS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0a3dvc2ZxZmFoZ3dya2NpcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzOTg4NjYsImV4cCI6MjA5NTk3NDg2Nn0.hXIj1nFSLK638wVnt5FpV33V1T3sJFkSFY8AjN2sjsM';

window.AVELIS_CONTACTS = {
  phone: '+380989709700',
  phoneDisplay: '+38 (098) 970-97-00',
  instagram: 'https://www.instagram.com/avelis.clinic/',
  telegram: '',
  whatsapp: 'https://wa.me/380989709700',
  viber: 'viber://chat?number=380989709700'
};

