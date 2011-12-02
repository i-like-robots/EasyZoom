/**
 * Easy Zoom 1.0 RC3
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
 * .zoom-container {
 *     position:relative;
 * }
 * #zoom-window {
 *     position:absolute;
 *     width:[*]px;
 *     height:[*]px;
 *     z-index:[*];
 * }
 *
 * Plugin use:
 * $('#zoom').easyZoom({
 *     id: '#zoom-window',
 *     parent: '.zoom-container'
 * });
 *
 * Options:
 * - id: The ID to assign the zoom window
 * - parent: Parent element to append zoom window to
 * - preload: Preloader content/text
 * - error: Error content/text
 *
 * Public methods:
 * - Get data object
 *   var $zoom = $('.zoom').data('easyZoom');
 *
 * - Hide open zoom window
 *   $zoom.hide();
 *
 * - Change image
 *   $zoom.update(src);
 */

;(function ($, undefined)
{
	function EasyZoom(target, options)
	{
		// Default options
		var defaults = {
			id: 'zoom-window',
			parent: 'body',
			preload: 'Loading...',
			error: '<p>There has been a problem attempting to loading the image.</p>'
		};

		this.options = $.extend({}, defaults, options);

		var self = this,
		    loaded = false,
		    found = true,
		    over = false,
		    dom = false,
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
				$panel:  $('<div id="' + self.options.id + '">' + self.options.preload + '</div>')
			};

			// Preload full size image
			preload(self.elements.$target.attr('href'));

			// Bind events to target
			self.elements.$target
				.on('click.easyZoom', function(e)
				{
					e.preventDefault();
				})
				.on('mouseenter.easyZoom', function(e)
				{
					over = true; // Use a variable for persistance
					start(e);
				})
				.on('mouseleave.easyZoom', function()
				{
					self.hide();
					over = false;
				})
				.on('mousemove.easyZoom', function(e)
				{
					move(e);
				});

			// Bind events to the panel
			self.elements.$panel
				.on('nodeRemoved', function() // DOMNodeRemoved
				{
					dom = false;
				})
				.on('nodeInserted', function() // DOMNodeInserted
				{
					dom = true;
				});
		}

		/**
		 * Preload
		 * @description Preloads the full sized image
		 */
		function preload(href)
		{
			loaded = false;

			self.elements.$target.css('cursor', 'progress');

			// Load full size image
			self.elements.$zoomed = self.loadimg(href)
				.on('error.easyZoom', function()
				{
					found = false;
				})
				.on('load.easyZoom', function()
				{
					loaded = true;

					// Attach image to panel
					self.elements.$panel.append( self.elements.$zoomed.css('position', 'absolute') );

					// Trigger panel to display if user is waiting
					if (over)
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
			if (!dom)
			{
				self.elements.$panel
					.appendTo(self.elements.$parent)
					.css('opacity', 0)
					.trigger('nodeInserted');
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

			self.elements.$zoomed.css({left: -xl, top: -xt});
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
				img = null; // Clear memory
			};

			return $(img);
		};

		/**
		 * Hide
		 * @description Public method to hide the zoom panel
		 */
		this.hide = function()
		{
			if (over)
			{
				self.elements.$panel
					.stop()
					.animate({opacity: 0}, 200, function()
					{
						self.elements.$panel = self.elements.$panel
							.detach()
							.trigger('nodeRemoved');
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

		/**
		 * Destroy
		 * @description Public method to remove zoom panel and events
		 */
		this.destroy = function()
		{
			this.hide();

			self.elements.$target
				.css('cursor', 'default')
				.unbind('.easyZoom');
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
			    source = $this.data('easyzoom-source');

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
