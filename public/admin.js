(function () {
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.hasAttribute('data-confirm')) {
      if (!confirm(form.getAttribute('data-confirm'))) e.preventDefault();
    }
  });

  document.querySelectorAll('[data-autosubmit] select').forEach(function (sel) {
    sel.addEventListener('change', function () { sel.form.submit(); });
  });

  var imgUrl = document.getElementById('img-url');
  var imgPreview = document.getElementById('img-preview');
  if (imgUrl && imgPreview) {
    imgUrl.addEventListener('input', function () {
      if (imgUrl.value) { imgPreview.src = imgUrl.value; imgPreview.classList.remove('hidden'); }
      else { imgPreview.classList.add('hidden'); }
    });
  }
})();
