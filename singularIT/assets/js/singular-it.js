particlesJS.load('particles-js', 'assets/particlejs.json', function() {
});

particlesJS.load('particles-js-light', 'assets/particlejs-light.json', function() {
});

particlesJS.load('particles-js-light-2', 'assets/particlejs-light.json', function() {
});

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

var SILVER_LOGO_DURATION = 5000;

var silver_logos = Array();
silver_logos.push("/images/snic_sponsor_logo/Logo_Topicus.jpg");
silver_logos.push("/images/snic_sponsor_logo/Logo_Procam.png");
silver_logos.push("/images/snic_sponsor_logo/Logo_DSW.png");

silver_logos = shuffle(silver_logos);
var silver_logos_iter = 0;

function changeSilverSponsorImage() {
  // var random_logo = silver_logos[Math.floor(Math.random() * silver_logos.length)];
  var logo = silver_logos[silver_logos_iter];
  $("#silver_logos").fadeOut(250, function() {
    $("#silver_logos").attr("src", logo);
    $("#silver_logos").fadeIn(250);
  });

  silver_logos_iter += 1;
  if (silver_logos_iter >= silver_logos.length) {
    silver_logos_iter = 0;
  }
}

changeSilverSponsorImage();
window.setInterval(function(){
  changeSilverSponsorImage();
}, SILVER_LOGO_DURATION);



$("#navbarToggle").on('click', function() {
  $("#navbar-main-collapse").toggle();
});
