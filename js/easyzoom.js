/**
 * Easy Zoom 1.0.1
 * Written by Matt Hinchliffe <http://www.github.com/i-like-robots/EasyZoom>
 * Based on the original work by Alen Grakalic <http://cssglobe.com/post/9711/jquery-plugin-easy-image-zoom>
 *
 * This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.
 * <http://creativecommons.org/licenses/by-sa/3.0/>
 *
 * Built for jQuery library 1.7+
 * http://jquery.com
 *
 * Example HTML:
 *     <div class="zoom-container">
 *         <a id="zoom" href="large_img.jpg">
 *             <img src="small_img.jpg" />
 *         </a>
 *     </div>
 *
 * Required CSS:
 *     .zoom-container {
 *         position:relative;
 *     }
 *     #zoom-target {
 *         display:block;
 *     }
 *     #zoom-panel {
 *         position:absolute;
 *         width:[*]px;
 *         height:[*]px;
 *         z-index:[*];
 *     }
 *
 * Plugin usage:
 *    $('#zoom').easyZoom({
 *        id: '#zoom-panel',
 *        parent: '.zoom-container'
 *    });
 *
 * Options:
 *  - id:      The ID attribute to assign the zoom panel
 *  - parent:  Parent element selector to append zoom panel to
 *  - error:   HTML to display within the zoom panel if an error occurs loading large image
 *  - loading: HTML to append and display to the zoom target while loading the large image
 *  - cursor:  Specify cursor display when interacting with easyZoom <http://developer.mozilla.org/en/CSS/cursor>
 *  - touch:   Enable touch events when available
 *
 * Public methods:
 *  1. Get the EasyZoom object from jQuery object data
 *     var $zoom = $('#zoom').data('easyZoom');
 *
 *  2. Change image
 *     $zoom.update(imageSrc);
 *
 *  3. Hide the zoom panel
 *     $zoom.hide();
 */

; (function ($, undefined)
{
	function EasyZoom(target, options)
	{
		// Default options
		var defaults = {
			id: 'zoom-panel',
			parent: 'body',
			error: '<p class="zoom-error">There has been a problem attempting to loading the image.</p>',
			loading: '<p class="fullsize-loading">Loading</p>',
			cursor: 'crosshair',
			touch: true
		};

		this.opts = $.extend({}, defaults, options);

		var self = this,
		    loaded = false,
		    found = true,
		    mouseover = false,
		    lx,ly,
		    w1,w2,w3,
		    h1,h2,h3,
		    rw,rh;

		/**
		 * Init
		 * @description Caches related DOM objects and sets up events
		 */
		function init()
		{
			// Select or create DOM elements
			self.ele = {
				$target: $(target),
				$source: $('img', target),
				$parent: $(self.opts.parent),
				$loader: $(self.opts.loading),
				$panel:  $('<div id="' + self.opts.id + '" />')
			};

			// Preload full size image
			preload(self.ele.$target.attr('href'));

			// Bind mouse events to target
			self.ele.$target
				.on('click', function(e)
				{
					e.preventDefault();
				})
				.on('mouseenter', function(e)
				{
					mouseover = true;
					show(e);
				})
				.on('mousemove', function(e)
				{
					move(e);
				})
				.on('mouseleave', function()
				{
					self.hide();
					mouseover = false;
				});

			// Bind touch events to target
			if (self.opts.touch && 'ontouchstart' in document.documentElement)
			{
				target.addEventListener('touchstart', function(e)
				{
					// Ignore multi-finger gestures
					if (e.touches.length === 1)
					{
						e.preventDefault();

						mouseover = true;
						show(e);
					}
				});
				target.addEventListener('touchmove', function(e)
				{
					if (e.touches.length === 1)
					{
						e.preventDefault();
						move(e);
					}
					else
					{
						self.ele.$target.trigger('mouseleave');
					}
				});
				target.addEventListener('touchend', function()
				{
					self.hide();
					mouseover = false;
				});
			}

			return self;
		}

		/**
		 * Preload
		 * @description Preloads the full sized image
		 */
		function preload(href)
		{
			loaded = false;

			// Display progress cursor when the user rolls over
			self.ele.$target.css('cursor', 'progress');

			// Display loading notice
			self.ele.$loader.appendTo(self.ele.$target);

			// Load full size image
			self.ele.$zoomed = self.loadimg(href)
				.on('error', function()
				{
					found = false;
					error();
				})
				.on('load', function()
				{
					loaded = true;

					// Set cursor
					self.ele.$target.css('cursor', self.opts.cursor);

					// Remove loading notice
					self.ele.$loader.detach();

					// Attach image to panel
					self.ele.$panel.html( self.ele.$zoomed.css('position', 'absolute') );

					// Display if the cursor is over the image
					if (mouseover)
					{
						self.ele.$target.trigger('mouseenter');
					}
				});
		}

		/**
		 * Error
		 * @description Display error message within zoom panel
		 */
		function error()
		{
			self.ele.$panel.html(self.opts.error);
		}

		/**
		 * Move
		 * @description Re-positions zoom panel image based on mouse event
		 */
		function move(e)
		{
			// Get mouse/touch position or last position if triggered by jQuery
			if (e.type.indexOf('touch') === 0)
			{
				lx = e.touches[0].pageX;
				ly = e.touches[0].pageY;
			}
			else
			{
				lx = e.pageX || lx;
				ly = e.pageY || ly;
			}

			var p = self.ele.$source.offset(),
			    pl = lx - p.left,
			    pt = ly - p.top,
			    xl = pl * rw,
			    xt = pt * rh;

			xl = (xl > w3) ? w3 : xl;
			xt = (xt > h3) ? h3 : xt;

			// Do not move the image if the event is outside
			if (xl > 0 && xt > 0)
			{
				self.ele.$zoomed.css({left: -xl, top: -xt});
			}
		}

		/**
		 * Show
		 * @description Displays zoom panel
		 */
		function show(e)
		{
			// Attach the panel to the page
			if (self.ele.$panel.parent().length === 0)
			{
				self.ele.$panel.appendTo(self.ele.$parent).css('opacity', 0);
			}

			self.ele.$panel
				.stop()
				.animate({opacity: 1}, 200);

			w1 = self.ele.$source.width();
			h1 = self.ele.$source.height();
			w2 = self.ele.$panel.width();
			h2 = self.ele.$panel.height();
			w3 = self.ele.$zoomed.width() - w2;
			h3 = self.ele.$zoomed.height() - h2;
			rw = w3 / w1;
			rh = h3 / h1;

			move(e);
		}

		/**
		 * Load image
		 * @description Load an image
		 * @returns A new image object
		 */
		this.loadimg = function(src)
		{
			var img = new Image();
			img.src = src + '?' + (new Date()).getTime(); // TODO: Is it necessary to skip cache?
			img.onload = function()
			{
				img = null;
			};

			return $(img);
		};

		/**
		 * Hide
		 * @description Public method to hide the zoom panel
		 */
		this.hide = function()
		{
			if (self.ele.$panel.parent().length)
			{
				self.ele.$panel
					.stop()
					.animate({opacity: 0}, 200, function()
					{
						self.ele.$panel = self.ele.$panel.detach();
					});
			}
		};

		/**
		 * Update
		 * @description Public shortcut method for hide() + preload()
		 */
		this.update = function(href)
		{
			this.hide();
			preload(href);
		};

		// Instantiate only for anchors and call at runtime to avoid compile time scope issues
		return target.tagName.toLowerCase() === 'a' ? init() : undefined;
	}

	// jQuery plugin wrapper
	$.fn.easyZoom = function(options)
	{
		return this.each(function()
		{
			$.data(this, 'easyZoom', new EasyZoom(this, options));
		});
	};

	// Gallery extension
	EasyZoom.prototype.gallery = function(selector, scope)
	{
		var self = this,
		    $scope = scope ? $(scope) : this.ele.$parent;

		$scope.on('click', selector, function(e)
		{
			e.preventDefault();

			var $this = $(this).addClass('thumbnail-loading'),
			    zoomed = $this.attr('href'),
			    source = $this.data('easyzoomSource');

			// Load new source image
			self.loadimg(source).on('load', function()
			{
				// Swap current source image
				self.ele.$source.attr('src', source);
				self.ele.$target.attr('href', zoomed);

				self.update(zoomed);

				$this.removeClass('thumbnail-loading');
			});
		});
	};

})(jQuery);
