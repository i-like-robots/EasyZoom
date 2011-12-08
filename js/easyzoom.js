/**
 * Easy Zoom 1.0
 * Written by Matt Hinchliffe <http://www.github.com/i-like-robots/EasyZoom>
 * Based on the original work by Alen Grakalic <http://cssglobe.com/post/9711/jquery-plugin-easy-image-zoom>
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Built for jQuery library 1.7+
 * http://jquery.com
 *
 * Example HTML:
 * <div class="zoom-container">
 *     <a id="zoom" href="large_img.jpg">
 *         <img src="small_img.jpg" />
 *     </a>
 * </div>
 *
 * Required CSS:
 * 
 * .zoom-container {
 *     position:relative;
 * }
 * #zoom-target {
 *     display:block;
 * }
 * #zoom-window {
 *     position:absolute;
 *     width:[*]px;
 *     height:[*]px;
 *     z-index:[*];
 * }
 *
 * Plugin use:
 *    $('#zoom').easyZoom({
 *        id: '#zoom-window',
 *        parent: '.zoom-container'
 *    });
 *
 * Options:
 *  - id: The ID to assign the zoom window
 *  - parent: Parent element to append zoom window to
 *  - error: Error content/text
 *  - touch: Enable touch events
 *
 * Public methods:
 * 1. Get data object
 *    var $zoom = $('.zoom').data('easyZoom');
 *
 * 2. Change image
 *    $zoom.update(src);
 *
 * 3. Hide zoom window
 *    $zoom.hide();
 */

;(function ($, undefined)
{
	function EasyZoom(target, options)
	{
		// Default options
		var defaults = {
			id: 'zoom-window',
			parent: 'body',
			error: '<p>There has been a problem attempting to loading the image.</p>',
			touch: true
		};

		this.options = $.extend({}, defaults, options);

		var self = this,
		    loaded = false,
		    found = true,
		    mouseover = false,
		    timeout,
		    lx,ly,
		    w1,w2,w3,w4,
		    h1,h2,h3,h4,
		    rw,rh;

		/**
		 * Init
		 * @description Caches related DOM objects and sets up events
		 */
		function init()
		{
			// Select or create DOM elements
			self.elements = {
				$target: $(target),
				$source: $('img', target),
				$parent: $(self.options.parent),
				$panel:  $('<div id="' + self.options.id + '" />')
			};

			// Preload full size image
			preload(self.elements.$target.attr('href'));

			// Bind mouse events to target
			self.elements.$target
				.on('click', function(e)
				{
					e.preventDefault();
				})
				.on('mouseenter', function(e)
				{
					mouseover = true;
					start(e);
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
			if (self.options.touch && 'ontouchstart' in document.documentElement)
			{
				target.addEventListener('touchstart', function(e)
				{
					if (e.touches.length == 1)
					{
						e.preventDefault();

						e.pageX = e.touches[0] || e.changedTouches[0];
						e.pageY = e.touches[0] || e.changedTouches[0];

						mouseover = true;
						start(e);
					}
				}, false);
				target.addEventListener("touchmove", function(e)
				{
					if (e.touches.length == 1)
					{
						e.preventDefault();

						e.pageX = e.touches[0] || e.changedTouches[0];
						e.pageY = e.touches[0] || e.changedTouches[0];

						move(e);
					}
					else
					{
						self.hide();
						mouseover = false;
					}
				}, false);
				target.addEventListener("touchend", function(e)
				{
					self.hide();
					mouseover = false;
				}, false);
			}
		}

		/**
		 * Preload
		 * @description Preloads the full sized image
		 */
		function preload(href)
		{
			loaded = false;

			self.elements.$target
				.css('cursor', 'progress');
				// Display loading thing

			// Load full size image
			self.elements.$zoomed = self.loadimg(href)
				.on('error', function()
				{
					found = false;
				})
				.on('load', function()
				{
					loaded = true;

					// Remove loading thing

					// Attach image to panel
					self.elements.$panel.html( self.elements.$zoomed.css('position', 'absolute') );

					// Display if the cursor is over the image
					if (mouseover)
					{
						self.elements.$target.trigger('mouseenter');
					}
				});
		}

		/**
		 * Start
		 * @description Add panel to page and display when full size image is loaded
		 */
		function start(e)
		{
			// Attach panel to the page
			if (self.elements.$panel.parent().length == 0)
			{
				self.elements.$panel
					.appendTo(self.elements.$parent)
					.css('opacity', 0);
			}

			if (!found)
			{
				error();
			}
			else
			{
				if (loaded)
				{
					show(e);
				}
				else
				{
					loop(e);
				}
			}
		}

		/**
		 * Loop
		 * @description Displays panel when full size image is loaded if mouse event has been called
		 */
		function loop(e)
		{
			if (loaded)
			{
				show(e);
				clearTimeout(timeout);
			}
			else
			{
				timeout = setTimeout(function()
				{
					loop(e);
				}, 200);
			}
		}

		/**
		 * Error
		 * @description Display error message within zoom panel
		 */
		function error()
		{
			self.elements.$panel.html(self.options.error);
		}

		/**
		 * Move
		 * @description Re-positions zoom panel image based on mouse event
		 */
		function move(e)
		{
			// Get mouse position or last position if triggered by jQuery
			lx = e.pageX || lx;
			ly = e.pageY || ly;

			var p = self.elements.$source.offset(),
			    pl = lx - p.left,
			    pt = ly - p.top,
			    xl = pl * rw,
			    xt = pt * rh;

			xl = (xl > w4) ? w4 : xl;
			xt = (xt > h4) ? h4 : xt;

			// Do not move the image if the event is outside
			if (xl > 0 && xt > 0)
			{
				self.elements.$zoomed.css({left: -xl, top: -xt});
			}
		}

		/**
		 * Show
		 * @description Displays zoom panel
		 */
		function show(e)
		{
			self.elements.$target.css('cursor', 'crosshair');

			var start = (new Date).getTime();

			self.elements.$panel
				.stop()
				.animate({opacity: 1}, 200);

			w1 = self.elements.$source.width();
			h1 = self.elements.$source.height();
			w2 = self.elements.$panel.width();
			h2 = self.elements.$panel.height();
			w4 = self.elements.$zoomed.width() - w2;
			h4 = self.elements.$zoomed.height() - h2;
			rw = w4 / w1;
			rh = h4 / h1;

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
			img.src = src + '?' + (new Date()).getTime();
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
			if (self.elements.$panel.parent().length)
			{
				self.elements.$panel
					.stop()
					.animate({opacity: 0}, 200, function()
					{
						self.elements.$panel = self.elements.$panel.detach();
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

		// Instantiate only for anchors
		if (target.tagName.toLowerCase() === 'a')
		{
			init(); // Call init at runtime to avoid compile time scope issues.

			return this;
		}
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
		    $scope = scope ? $(scope) : this.elements.$parent;

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
				self.elements.$source.attr('src', source);
				self.elements.$target.attr('href', zoomed);

				self.update(zoomed);

				$this.removeClass('thumbnail-loading');
			});
		});
	};

})(jQuery);
