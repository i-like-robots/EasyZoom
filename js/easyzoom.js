/*!
 * @name        EasyZoom
 * @author      Matt Hinchliffe <https://github.com/i-like-robots/EasyZoom>
 * @modified    2013-06-03
 * @version     2.0.0b
 */
(function ($, undefined) {

    var dw, dh, rw, rh, lx, ly;

    var defaults = {
        loading: 'Loading',
        error: 'The image could not be loaded'
    };

    /**
     * EasyZoom
     * @constructor
     * @param {Object} target
     * @param {Object} options
     */
    function EasyZoom(target, options) {

        this.$target = $(target);
        this.opts = $.extend({}, defaults, options);

        if ( this.isOpen === undefined ) {
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
        this.$link   = this.$target.find('a');
        this.$image  = this.$target.find('img');
        this.$flyout = $('<div class="easyzoom-flyout" />');
        this.$notice = $('<div class="easyzoom-notice" />').text(this.opts.loading);

        // Preload zoomed image
        this._loadFlyout(this.$link.attr('href'));

        // Setup target events
        this.$target
            .on('mouseenter touchstart', function(e) {
                if ( ! e.originalEvent.touches || e.originalEvent.touches.length === 1 ) {
                    e.preventDefault();
                    self.show(e);
                }
            })
            .on('mousemove touchmove', function(e) {
                if ( self.isOpen) {
                    e.preventDefault();
                    self._move(e);
                }
            })
            .on('mouseleave touchend', function() {
                if ( self.isOpen) {
                    self.hide();
                }
            });
    };

    /**
     * Show
     * @param {Event} e
     */
    EasyZoom.prototype.show = function(e) {

        var w1, h1, w2, h2;

        if (this.$flyout.parent().length || ! this.isReady) {
            return;
        }

        this.isOpen = true;

        this.$flyout.appendTo(this.$target);

        w1 = this.$image.width();
        h1 = this.$image.height();
        w2 = this.$flyout.width();
        h2 = this.$flyout.height();

        dw = this.$zoom.width() - w2;
        dh = this.$zoom.height() - h2;
        rw = dw / w1;
        rh = dh / h1;

        this._move(e);
    };

    /**
     * Hide
     */
    EasyZoom.prototype.hide = function() {
        if (this.$flyout.parent().length) {
            this.$flyout.detach();
            this.isOpen = false;
        }
    };

    /**
     * Move
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype._move = function(e) {

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

        xl = (xl > dw) ? dw : xl;
        xt = (xt > dh) ? dh : xt;

        // Do not move the image if the event is outside
        if (xl > 0 && xt > 0) {
            this.$zoom.css({left: -xl, top: -xt});
        }
    };

    /**
     * Load Flyout
     * @private
     * @param {String} href
     */
    EasyZoom.prototype._loadFlyout = function(href) {

        var self = this;
        var img = new Image();

        this.isReady = false;
        this.$target.addClass('is-loading').append(this.$notice);

        img.onerror = function() {
            self.$notice.text(self.opts.error);
            self.$target.removeClass('is-loading').addClass('is-error');
        };

        img.onload = function() {
            self.isReady = true;
            self.$notice.detach();
            self.$flyout.html(self.$zoom);
            self.$target.removeClass('is-loading').addClass('is-ready');
        };

        img.style.position = 'absolute';
        img.src = href;

        this.$zoom = $(img);
    };

    // /**
    //  * Update
    //  * @param {String} href
    //  */
    // EasyZoom.prototype.update = function(href) {
    //     this.hide();
    //     this._loadFlyout(href);
    // };

    // /**
    //  * Gallery
    //  * @param  {String} selector
    //  * @param  {String} scope
    //  */
    // EasyZoom.prototype.gallery = function(selector, scope) {
    //     var self = this;
    //     var $scope = scope ? $(scope) : this.e.parent;

    //     $scope.on('click', selector, function(e) {
    //         e.preventDefault();

    //         var $this = $(this).addClass('is-loading');
    //         var zoomed = $this.attr('href');
    //         var source = $this.data('easyzoomSource');

    //         // Load new source image
    //         self._preloadImage(source).on('load', function() {

    //             // Swap current source image
    //             self.e.source.attr('src', source);
    //             self.e.target.attr('href', zoomed);

    //             self.update(zoomed);

    //             $this.removeClass('is-loading');
    //         });
    //     });
    // };

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
