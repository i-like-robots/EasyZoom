(function (root, factory) {
    'use strict';
    if(typeof define === 'function' && define.amd) {
        define(['jquery'], function($){
            factory($);
        });
    } else if(typeof module === 'object' && module.exports) {
        module.exports = (root.EasyZoom = factory(require('jquery')));
    } else {
        root.EasyZoom = factory(root.jQuery);
    }
}(this, function ($) {

    'use strict';

    var zoomImgOverlapX;
    var zoomImgOverlapY;
    var ratioX;
    var ratioY;
    var pointerPositionX;
    var pointerPositionY;

    var defaults = {

        // The text to display within the notice box while loading the zoom image.
        loadingNotice: 'Loading image',

        // The text to display within the notice box if an error occurs when loading the zoom image.
        errorNotice: 'The image could not be loaded',

        // The time (in milliseconds) to display the error notice.
        errorDuration: 2500,

        // Attribute to retrieve the zoom image URL from.
        linkAttribute: 'href',

        // Prevent clicks on the zoom image link.
        preventClicks: true,

        // Callback function to execute before the flyout is displayed.
        beforeShow: $.noop,

        // Callback function to execute before the flyout is removed.
        beforeHide: $.noop,

        // Callback function to execute when the flyout is displayed.
        onShow: $.noop,

        // Callback function to execute when the flyout is removed.
        onHide: $.noop,

        // Callback function to execute when the cursor is moved while over the image.
        onMove: $.noop

    };

    /**
     * EasyZoom
     * @constructor
     * @param {Object} target
     * @param {Object} options (Optional)
     */
    function EasyZoom(target, options) {
        this.$target = $(target);
        this.opts = $.extend({}, defaults, options, this.$target.data());

        this.isOpen === undefined && this._init();
    }

    /**
     * Init
     * @private
     */
    EasyZoom.prototype._init = function() {
        this.$link   = this.$target.find('a');
        this.$image  = this.$target.find('img');

        this.$flyout = $('<div class="easyzoom-flyout" />');
        this.$notice = $('<div class="easyzoom-notice" />');

        this.$target.on({
            'mousemove.easyzoom touchmove.easyzoom': $.proxy(this._onMove, this),
            'mouseleave.easyzoom touchend.easyzoom': $.proxy(this._onLeave, this),
            'mouseenter.easyzoom touchstart.easyzoom': $.proxy(this._onEnter, this)
        });

        this.opts.preventClicks && this.$target.on('click.easyzoom', function(e) {
            e.preventDefault();
        });
    };

    /**
     * Show
     * @param {MouseEvent|TouchEvent} e
     * @param {Boolean} testMouseOver (Optional)
     */
    EasyZoom.prototype.show = function(e, testMouseOver) {
        var self = this;

        if (this.opts.beforeShow.call(this) === false) return;

        if (!this.isReady) {
            return this._loadImage(this.$link.attr(this.opts.linkAttribute), function() {
                if (self.isMouseOver || !testMouseOver) {
                    self.show(e);
                }
            });
        }

        this.$target.append(this.$flyout);

        var targetWidth = this.$target.outerWidth();
        var targetHeight = this.$target.outerHeight();

        var flyoutInnerWidth = this.$flyout.width();
        var flyoutInnerHeight = this.$flyout.height();

        var zoomImgWidth = this.$zoom.width();
        var zoomImgHeight = this.$zoom.height();

        zoomImgOverlapX = Math.ceil(zoomImgWidth - flyoutInnerWidth);
        zoomImgOverlapY = Math.ceil(zoomImgHeight - flyoutInnerHeight);

        // For when the zoom image is smaller than the flyout element.
        if (zoomImgOverlapX < 0) zoomImgOverlapX = 0;
        if (zoomImgOverlapY < 0) zoomImgOverlapY = 0;

        ratioX = zoomImgOverlapX / targetWidth;
        ratioY = zoomImgOverlapY / targetHeight;

        this.isOpen = true;

        this.opts.onShow.call(this);

        e && this._move(e);
    };

    /**
     * On enter
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype._onEnter = function(e) {
        var touches = e.originalEvent.touches;

        this.isMouseOver = true;

        if (!touches || touches.length == 1) {
            e.preventDefault();
            this.show(e, true);
        }
    };

    /**
     * On move
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype._onMove = function(e) {
        if (!this.isOpen) return;

        e.preventDefault();
        this._move(e);
    };

    /**
     * On leave
     * @private
     */
    EasyZoom.prototype._onLeave = function() {
        this.isMouseOver = false;
        this.isOpen && this.hide();
    };

    /**
     * On load
     * @private
     * @param {Event} e
     */
    EasyZoom.prototype._onLoad = function(e) {
        // IE may fire a load event even on error so test the image dimensions
        if (!e.currentTarget.width) return;

        this.isReady = true;

        this.$notice.detach();
        this.$flyout.html(this.$zoom);
        this.$target.removeClass('is-loading').addClass('is-ready');

        e.data.call && e.data();
    };

    /**
     * On error
     * @private
     */
    EasyZoom.prototype._onError = function() {
        var self = this;

        this.$notice.text(this.opts.errorNotice);
        this.$target.removeClass('is-loading').addClass('is-error');

        this.detachNotice = setTimeout(function() {
            self.$notice.detach();
            self.detachNotice = null;
        }, this.opts.errorDuration);
    };

    /**
     * Load image
     * @private
     * @param {String} href
     * @param {Function} callback
     */
    EasyZoom.prototype._loadImage = function(href, callback) {
        var zoom = new Image();

        this.$target
            .addClass('is-loading')
            .append(this.$notice.text(this.opts.loadingNotice));

        this.$zoom = $(zoom)
            .on('error', $.proxy(this._onError, this))
            .on('load', callback, $.proxy(this._onLoad, this));

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
            pointerPositionX = touchlist[0].pageX;
            pointerPositionY = touchlist[0].pageY;
        } else {
            pointerPositionX = e.pageX || pointerPositionX;
            pointerPositionY = e.pageY || pointerPositionY;
        }

        var targetOffset  = this.$target.offset();
        var relativePositionX = pointerPositionX - targetOffset.left;
        var relativePositionY = pointerPositionY - targetOffset.top;
        var moveX = Math.ceil(relativePositionX * ratioX);
        var moveY = Math.ceil(relativePositionY * ratioY);

        // Close if outside
        if (moveX < 0 || moveY < 0 || moveX > zoomImgOverlapX || moveY > zoomImgOverlapY) {
            this.hide();
        } else {
            var top = moveY * -1;
            var left = moveX * -1;

            this.$zoom.css({
                top: top,
                left: left
            });

            this.opts.onMove.call(this, top, left);
        }

    };

    /**
     * Hide
     */
    EasyZoom.prototype.hide = function() {
        if (!this.isOpen) return;
        if (this.opts.beforeHide.call(this) === false) return;

        this.$flyout.detach();
        this.isOpen = false;

        this.opts.onHide.call(this);
    };

    /**
     * Swap
     * @param {String} standardSrc
     * @param {String} zoomHref
     * @param {String|Array} srcset (Optional)
     */
    EasyZoom.prototype.swap = function(standardSrc, zoomHref, srcset) {
        this.hide();
        this.isReady = false;

        this.detachNotice && clearTimeout(this.detachNotice);

        this.$notice.parent().length && this.$notice.detach();

        this.$target.removeClass('is-loading is-ready is-error');

        this.$image.attr({
            src: standardSrc,
            srcset: $.isArray(srcset) ? srcset.join() : srcset
        });

        this.$link.attr(this.opts.linkAttribute, zoomHref);
    };

    /**
     * Teardown
     */
    EasyZoom.prototype.teardown = function() {
        this.hide();

        this.$target
            .off('.easyzoom')
            .removeClass('is-loading is-ready is-error');

        this.detachNotice && clearTimeout(this.detachNotice);

        delete this.$link;
        delete this.$zoom;
        delete this.$image;
        delete this.$notice;
        delete this.$flyout;

        delete this.isOpen;
        delete this.isReady;
    };

    // jQuery plugin wrapper
    $.fn.easyZoom = function(options) {
        return this.each(function() {
            var api = $.data(this, 'easyZoom');

            if (!api) {
                $.data(this, 'easyZoom', new EasyZoom(this, options));
            } else if (api.isOpen === undefined) {
                api._init();
            }
        });
    };

    return EasyZoom;
}));
