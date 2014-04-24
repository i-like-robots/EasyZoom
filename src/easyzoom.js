(function ($) {

    'use strict';

    var dw, dh, rw, rh, lx, ly;

    var defaults = {

        // The text to display within the notice box while loading the zoom image.
        loadingNotice: 'Loading image',

        // The text to display within the notice box if an error occurs loading the zoom image.
        errorNotice: 'The image could not be loaded',

        // Prevent clicks on the zoom image link.
        preventClicks: true,

        // Callback function to execute when the flyout is displayed.
        onShow: undefined,

        // Callback function to execute when the flyout is removed.
        onHide: undefined

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
            this._init();
        }

        return this;
    }

    /**
     * Init
     * @private
     */
    EasyZoom.prototype._init = function() {
        var self = this;

        this.$link   = this.$target.find('a');
        this.$image  = this.$target.find('img');

        this.$flyout = $('<div class="easyzoom-flyout" />');
        this.$notice = $('<div class="easyzoom-notice" />');

        this.$target
            .on('mouseenter.easyzoom touchstart.easyzoom', function(e) {
                if ( ! e.originalEvent.touches || e.originalEvent.touches.length === 1) {
                    e.preventDefault();
                    self.show(e);
                }
            })
            .on('mousemove.easyzoom touchmove.easyzoom', function(e) {
                if (self.isOpen) {
                    e.preventDefault();
                    self._move(e);
                }
            })
            .on('mouseleave.easyzoom touchend.easyzoom', function() {
                if (self.isOpen) {
                    self.hide();
                }
            });

        if (this.opts.preventClicks) {
            this.$target.on('click.easyzoom', 'a', function(e) {
                e.preventDefault();
            });
        }
    };

    /**
     * Show
     * @param {MouseEvent|TouchEvent} e
     */
    EasyZoom.prototype.show = function(e) {
        var w1, h1, w2, h2;
        var self = this;

        if (! this.isReady) {
            this._load(this.$link.attr('href'), function() {
                self.show(e);
            });

            return;
        }

        this.$target.append(this.$flyout);

        w1 = this.$target.width();
        h1 = this.$target.height();

        w2 = this.$flyout.width();
        h2 = this.$flyout.height();

        dw = this.$zoom.width() - w2;
        dh = this.$zoom.height() - h2;

        rw = dw / w1;
        rh = dh / h1;

        this.isOpen = true;

        if (this.opts.onShow) {
            this.opts.onShow.call(this);
        }

        if (e) {
            this._move(e);
        }
    };

    /**
     * Load
     * @private
     * @param {String} href
     * @param {Function} callback
     */
    EasyZoom.prototype._load = function(href, callback) {
        var self = this;
        var zoom = new Image();

        this.$target.addClass('is-loading').append(this.$notice.text(this.opts.loadingNotice));

        this.$zoom = $(zoom);

        zoom.onerror = function() {
            self.$notice.text(self.opts.errorNotice);
            self.$target.removeClass('is-loading').addClass('is-error');
        };

        zoom.onload = function() {

            // IE may fire a load event even on error so check the image has dimensions
            if (zoom.width === 0) {
                return;
            }

            self.isReady = true;

            self.$notice.detach();
            self.$flyout.html(self.$zoom);
            self.$target.removeClass('is-loading').addClass('is-ready');

            callback();
        };

        zoom.style.position = 'absolute';
        zoom.src = href;
    };

    /**
     * Move
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype._move = function(e) {

        if (e.type.indexOf('touch') === 0) {
            var touchlist = e.touches || e.originalEvent.touches;
            lx = touchlist[0].pageX;
            ly = touchlist[0].pageY;
        }
        else {
            lx = e.pageX || lx;
            ly = e.pageY || ly;
        }

        var offset  = this.$target.offset();
        var pt = ly - offset.top;
        var pl = lx - offset.left;
        var xt = pt * rh;
        var xl = pl * rw;

        // xt = (xt > dh) ? dh : xt;
        // xl = (xl > dw) ? dw : xl;

        // Close if outside
        if (xl < 0 || xt < 0 || xl > dw || xt > dh) {
            this.hide();
        }
        else {
            this.$zoom.css({
                top:  '' + (Math.ceil(xt) * -1) + 'px',
                left: '' + (Math.ceil(xl) * -1) + 'px'
            });
        }

    };

    /**
     * Hide
     */
    EasyZoom.prototype.hide = function() {
        if (this.isOpen) {
            this.$flyout.detach();
            this.isOpen = false;

            if (this.opts.onHide) {
                this.opts.onHide.call(this);
            }
        }
    };

    /**
     * Swap
     * @param {String} standardSrc
     * @param {String} zoomHref
     */
    EasyZoom.prototype.swap = function(standardSrc, zoomHref) {
        this.hide();
        this.isReady = false;

        this.$target.removeClass('is-loading is-ready is-error');
        this.$image.attr('src', standardSrc);
        this.$link.attr('href', zoomHref);
    };

    /**
     * Teardown
     */
    EasyZoom.prototype.teardown = function() {
        this.hide();

        this.$target.removeClass('is-loading is-ready is-error').off('.easyzoom');

        delete this.$link;
        delete this.$zoom;
        delete this.$image;
        delete this.$notice;
        delete this.$flyout;

        delete this.isOpen;
        delete this.isReady;
    };

    // jQuery plugin wrapper
    $.fn.easyZoom = function( options ) {
        return this.each(function() {
            var api = $.data(this, 'easyZoom');

            if ( ! api) {
                $.data(this, 'easyZoom', new EasyZoom(this, options));
            }
            else if ( api.isOpen === undefined ) {
                api._init();
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
