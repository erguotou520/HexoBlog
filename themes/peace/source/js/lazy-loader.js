(function ($) {
  var $lazyImages;
  $(function () {
    $lazyImages = $('.js-lazy');
    $lazyImages.each(function () {
      var $lazy = $(this);
      // lazy bg images
      if ($lazy.hasClass('js-lazy-bg')) {
        $lazy.css('background-image', 'url(' + $lazy.data('lazy') + ')');
      } else if ($lazy.hasClass('js-lazy-img')) {
        // lazy images
        $lazy.attr('src', $lazy.data('lazy'));
      }
    });
  });
})(jQuery);
