// Google map stuff
function init_map() {
    // Basic options for a simple Google Map
    // For more options see: https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var mapOptions = {
        // How zoomed in you want the map to start at (always required)
        zoom: 15,

        // The latitude and longitude to center the map (always required)
        center: new google.maps.LatLng(52.5158274, 6.0979919999999765), // New York

        scrollwheel: false,
        mapTypeControl: false,
        // zoomControlOptions: {
        //     style: google.maps.ZoomControlStyle.SMALL,
        //     position: google.maps.ControlPosition.LEFT_TOP
        // },
        // How you would like to style the map.
        // This is where you would paste any style found on Snazzy Maps.
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#00bab3"
                    },
                    {
                        "lightness": 0
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 20
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#dedede"
                    },
                    {
                        "lightness": 17
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#dedede"
                    },
                    {
                        "lightness": 29
                    },
                    {
                        "weight": 0.2
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#dedede"
                    },
                    {
                        "lightness": 18
                    }
                ]
            },
            {
                "featureType": "road.local",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 16
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f1f1f1"
                    },
                    {
                        "lightness": 21
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "visibility": "on"
                    },
                    {
                        "color": "#ffffff"
                    },
                    {
                        "lightness": 16
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "saturation": 36
                    },
                    {
                        "color": "#333333"
                    },
                    {
                        "lightness": 40
                    }
                ]
            },
            {
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#f2f2f2"
                    },
                    {
                        "lightness": 19
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#fefefe"
                    },
                    {
                        "lightness": 20
                    }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#fefefe"
                    },
                    {
                        "lightness": 17
                    },
                    {
                        "weight": 1.2
                    }
                ]
            }
        ]
    };

    // Get the HTML DOM element that will contain your map
    // We are using a div with id="map" seen below in the <body>
    var mapElement = document.getElementById('map');

    // Create the Google Map using our element and options defined above
    var map = new google.maps.Map(mapElement, mapOptions);

    var contentString = '<div id="content">'+
        '<h1>Theater de Spiegel</h1>'+
        '<div role="separator" class="separator"></div>'+
        '<p>Spinhuisplein 14, 8011 ZZ Zwolle</p></p>'+
        '<p><a href="http://www.zwolsetheaters.nl/" target="_blank">'+
        'www.zwolsetheaters.nl</a></p>'+
        ''+
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });

    // Let's also add a marker while we're at it
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(52.5158274, 6.0979919999999765),
        map: map,
        title: 'Theater de Spiegel'
    });

    marker.addListener('click', function() {
        infowindow.open(map, marker);
    });

    infowindow.open(map, marker);
}

if (window.google && window.google.maps) {
    google.maps.event.addDomListener(window, 'load', init_map);
}

jQuery(function($) {
    $('button.toggle').click(function(evt){
        var target = $(this).data('target');
        $(target).toggleClass('open');
        $(this).toggleClass('open');
    });
});

$('.dropdown-toggle').dropdown();

// jQuery.shorten: https://github.com/viralpatel/jquery.shorten
// !function(e){e.fn.shorten=function(s){"use strict";var t={showChars:100,minHideChars:10,ellipsesText:"...",moreText:"more",lessText:"less",onLess:function(){},onMore:function(){},errMsg:null,force:!1};return s&&e.extend(t,s),e(this).data("jquery.shorten")&&!t.force?!1:(e(this).data("jquery.shorten",!0),e(document).off("click",".morelink"),e(document).on({click:function(){var s=e(this);return s.hasClass("less")?(s.removeClass("less"),s.html(t.moreText),s.parent().prev().animate({height:"0%"},function(){s.parent().prev().prev().show()}).hide("fast",function(){t.onLess()})):(s.addClass("less"),s.html(t.lessText),s.parent().prev().animate({height:"100%"},function(){s.parent().prev().prev().hide()}).show("fast",function(){t.onMore()})),!1}},".morelink"),this.each(function(){var s=e(this),n=s.html(),r=s.text().length;if(r>t.showChars+t.minHideChars){var o=n.substr(0,t.showChars);if(o.indexOf("<")>=0){for(var a=!1,i="",h=0,l=[],c=null,f=0,u=0;u<=t.showChars;f++)if("<"!=n[f]||a||(a=!0,c=n.substring(f+1,n.indexOf(">",f)),"/"==c[0]?c!="/"+l[0]?t.errMsg="ERROR en HTML: the top of the stack should be the tag that closes":l.shift():"br"!=c.toLowerCase()&&l.unshift(c)),a&&">"==n[f]&&(a=!1),a)i+=n.charAt(f);else if(u++,h<=t.showChars)i+=n.charAt(f),h++;else if(l.length>0){for(j=0;j<l.length;j++)i+="</"+l[j]+">";break}o=e("<div/>").html(i+'<span class="ellip">'+t.ellipsesText+"</span>").html()}else o+=t.ellipsesText;var m='<div class="shortcontent">'+o+'</div><div class="allcontent">'+n+'</div><span><a href="javascript://nop/" class="morelink">'+t.moreText+"</a></span>";s.html(m),s.find(".allcontent").hide(),e(".shortcontent p:last",s).css("margin-bottom",0)}}))}}(jQuery);

// $('.shorten').shorten({
//     "showChars" : 150,
//     "moreText"  : "See More"
// });

$('.shorten').curtail({
    'limit': 300,
    toggle: true,
    text: ['Show less', 'Show more']
});
