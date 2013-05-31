/*!
 * @name        EasyZoom
 * @author      Matt Hinchliffe <https://github.com/i-like-robots/EasyZoom>
 * @modified    2013-05-31
 * @version     2.0.0b
 */
(function ($, undefined) {

    var w3, h3, rw, rh, lx, ly;

    var defaults = {
        width: 480,
        height: 640,
        top: 0,
        left: 500,
        loading: 'Loading.'
    };

    /**
     * EasyZoom
     * @constructor
     * @param {Object} zoom
     * @param {Object} options
     */
    function EasyZoom(zoom, options) {

        this.$zoom = $(zoom);
        this.opts = $.extend({}, defaults, options);

        if ( this.open === undefined ) {
            this.__init();
        }

        return this;
    }

    /**
     * Init
     * @private
     */
    EasyZoom.prototype.__init = function() {

        var self = this;

        // Components
        this.$target    = this.$zoom.find('.easyzoom-target');
        this.$image     = this.$target.children('img');
        this.$gallery   = this.$zoom.find('.easyzoom-gallery');
        this.$flyout    = $('<div class="easyzoom-flyout" />');
        this.$loading   = $('<p class="easyzoom-loading">' + this.opts.loading + '</p>');

        // Setup zoom area
        this.$zoom.css('position', 'relative');

        // Setup flyout
        this.$flyout.css({
            position: 'absolute',
            top: this.opts.top,
            left: this.opts.left,
            width: this.opts.width,
            height: this.opts.height,
            overflow: 'hidden'
        });

        // Preload zoomed image
        this.__loadFlyout(this.$target.attr('href'));

        // Setup target
        this.$target
            .css({
                position: 'relative',
                display: 'inline-block'
            })
            .on('mouseenter touchstart', function(e) {
                if ( ! e.originalEvent.touches || e.originalEvent.touches.length === 1 ) {
                    e.preventDefault();
                    self.show(e);
                }
            })
            .on('mousemove touchmove', function(e) {
                if ( self.open) {
                    e.preventDefault();
                    self.__move(e);
                }
            })
            .on('mouseleave touchend', function() {
                if ( self.open) {
                    self.hide();
                }
            });
    };

    /**
     * Load Flyout
     * @private
     * @param {String} href
     */
    EasyZoom.prototype.__loadFlyout = function(href) {

        var self = this;
        var $img = this.__loadImage(href);

        this.loaded = false;

        this.$target.css('cursor', 'progress').addClass('is-loading').append(this.$loading);

        $img.on('error', function() {
            self.$loading.detach();
            self.$target.css('cursor', 'auto');
        });

        $img.on('load', function() {
            self.loaded = true;
            self.$loading.detach();
            self.$target.removeClass('is-loading').css('cursor', 'crosshair');
            self.$flyout.html( $img.css('position', 'absolute') );
        });

        this.$imageZoomed = $img;
    };

    /**
     * Show
     * @param {Event} e
     */
    EasyZoom.prototype.show = function(e) {

        var w1, h1, w2, h2;

        if (this.$flyout.parent().length || ! this.loaded) {
            return;
        }

        this.open = true;

        this.$flyout.appendTo(this.$zoom);

        w1 = this.$image.width();
        h1 = this.$image.height();
        w2 = this.$flyout.width();
        h2 = this.$flyout.height();
        w3 = this.$imageZoomed.width() - w2;
        h3 = this.$imageZoomed.height() - h2;
        rw = w3 / w1;
        rh = h3 / h1;

        this.__move(e);
    };

    /**
     * Hide
     */
    EasyZoom.prototype.hide = function() {
        if (this.$flyout.parent().length) {
            this.$flyout.detach();
            this.open = false;
        }
    };

    /**
     * Move
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype.__move = function(e) {

        if (e.type.indexOf('touch') === 0) {
            lx = e.originalEvent.touches[0].pageX;
            ly = e.originalEvent.touches[0].pageY;
        }
        else {
            lx = e.pageX || lx;
            ly = e.pageY || ly;
        }

        var p  = this.$image.offset();
        var pl = lx - p.left;
        var pt = ly - p.top;
        var xl = pl * rw;
        var xt = pt * rh;

        xl = (xl > w3) ? w3 : xl;
        xt = (xt > h3) ? h3 : xt;

        // Do not move the image if the event is outside
        if (xl > 0 && xt > 0) {
            this.$imageZoomed.css({left: -xl, top: -xt});
        }
    };

    /**
     * Load image
     * @private
     * @returns {Object}
     */
    EasyZoom.prototype.__loadImage = function(src) {
        var img = new Image();
        img.src = src;
        return $(img);
    };

    /**
     * Update
     * @param {String} href
     */
    EasyZoom.prototype.update = function(href) {
        this.hide();
        this.__preloadPanel(href);
    };

    /**
     * Gallery
     * @param  {String} selector
     * @param  {String} scope
     */
    EasyZoom.prototype.gallery = function(selector, scope) {
        var self = this;
        var $scope = scope ? $(scope) : this.e.parent;

        $scope.on('click', selector, function(e) {
            e.preventDefault();

            var $this = $(this).addClass('is-loading');
            var zoomed = $this.attr('href');
            var source = $this.data('easyzoomSource');

            // Load new source image
            self.__loadImage(source).on('load', function() {

                // Swap current source image
                self.e.source.attr('src', source);
                self.e.target.attr('href', zoomed);

                self.update(zoomed);

                $this.removeClass('is-loading');
            });
        });
    };

    // jQuery plugin wrapper
    $.fn.easyZoom = function( options ) {
        return this.each(function() {
            if ( ! $.data(this, 'easyZoom') ) {
                $.data(this, 'easyZoom', new EasyZoom(this, options));
            }
        });
    };

    // AMD and CommonJS module compatibility
    if ( typeof define === 'function' && define.amd ){
        define(function() {
            return EasyZoom;
        });
    }
    else if ( typeof module !== 'undefined' && module.exports ) {
        module.exports = EasyZoom;
    }

})(jQuery);
