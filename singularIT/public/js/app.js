particlesJS.load('particles-js', 'assets/particlejs.json', function() {
  console.log('callback - particles.js config loaded');
});

particlesJS.load('particles-js-light', 'assets/particlejs-light.json', function() {
  console.log('callback - particles.js config loaded');
});

particlesJS.load('particles-js-light-2', 'assets/particlejs-light.json', function() {
  console.log('callback - particles.js config loaded');
});


$(document).on('click', 'a[href^="#"]', function(e) {
    // target element id
    var id = $(this).attr('href');

    // target element
    var $id = $(id);
    if ($id.length === 0) {
        return;
    }

    // prevent standard hash navigation (avoid blinking in IE)
    e.preventDefault();

    // top position relative to the document
    var pos = $id.offset().top;

    // animated top scrolling
    $('body, html').animate({scrollTop: pos});
});
