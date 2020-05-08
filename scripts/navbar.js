setTimeout(function() {
  var isMobile;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    isMobile = true;

    // Mobile height fix
    $('.height-fix').each(function() {
      var h = $(this).height();
      $(this).height(h);
    });
  }

  // Sticky Nav on Mobile
  if (isMobile) {
    $('nav').addClass('fixed');
  } else {
    $('nav').addClass('desk');
  }


  // NAV POSITION
  var navPos = $('nav').position().top;
  var lastPos = 0;
  var lockTimer;
  $(window).on('scroll', function() {
    var pos = $(window).scrollTop();
    var pos2 = pos + 50;
    var scrollBottom = pos + $(window).height();

    if (!isMobile) {
      if (pos >= navPos + $('nav').height() && lastPos < pos) {
        $('nav').addClass('fixed');
      }
      if (pos < navPos && lastPos > pos) {
        $('nav').removeClass('fixed');
      }
      lastPos = pos;
    }
    
    //Link Highlighting
    if (pos2 > $('#home').offset().top) {
      highlightLink('home');
      $('nav').css('border-color', '#ffffff')
    }
    if (pos2 > $('#about').offset().top) {
      highlightLink('about');
      $('nav').css('border-color', '#4285f4')
    }
    if (pos2 > $('#experience').offset().top) {
      highlightLink('experience');
      $('nav').css('border-color', '#ea4336')
    }
    if (pos2 > $('#projects').offset().top) {
      highlightLink('projects');
      $('nav').css('border-color', '#fbbc05')
    }
    if (pos2 > $('#contact').offset().top || pos + $(window).height() === $(document).height()) {
      highlightLink('contact');
      $('nav').css('border-color', '#34a853')
    }

    // Prevent Hover on Scroll
    clearTimeout(lockTimer);
    if (!$('body').hasClass('disable-hover')) {
      $('body').addClass('disable-hover');
    }

    lockTimer = setTimeout(function() {
      $('body').removeClass('disable-hover');
    }, 500);
  });
  
  function highlightLink(anchor) {
    $('nav .active').removeClass('active');
    $('nav')
      .find('[dest="' + anchor + '"]')
      .addClass('active');
  }

  // EVENT HANDLERS
  $('.dest-link').click(function() {
    var x = $('.dest-link');
    var anchor = $(this).attr('dest');
    $('.navbar-nav').removeClass('visible');

    $('nav span').removeClass('active');
    $('nav')
      .find('[dest="' + anchor + '"]')
      .addClass('active');

    $('html, body').animate(
      {
        scrollTop: $('#' + anchor).offset().top
      },
      400
    );
  });
}, 3000);
