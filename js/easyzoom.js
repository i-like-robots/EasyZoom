/**
 * Based on Easy Zoom 1.0 - jQuery plugin
 * Written by Matt Hinchliffe
 * http://www.github.com/i-like-robots/EasyZoom
 * Based on the original work by Alen Grakalic
 * http://cssglobe.com/post/9711/jquery-plugin-easy-image-zoom
 *
 * Copyright (c) 2011 Alen Grakalic (http://cssglobe.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Built for jQuery library
 * http://jquery.com
 *
 * Example HTML:
 * <div class="zoom-container">
 *     <a class="zoom" href="large_img.jpg">
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
 * $('.zoom').easyZoom({
 *     id: '#zoom-window',
 *     parent: '.zoom-container'
 * });
 *
 * Options:
 * - id: The ID to give the zoom window
 * - parent: Parent element selector to append zoom window to
 * - preload: Preloader content/text
 * - error: Error content/text
 *
 * Public methods:
 *  - // Get data object
 *    var $zoom = $('.zoom').data('easyZoom');
 *  - // Hide open zoom window
 *    $zoom.hide();
 *  - // Change image
 *    $zoom.load(src);
 */

;(function ($, undefined)
{
	function EasyZoom(target, options)
	{
		var defaults = {
			id: 'zoom-window',
			parent: 'body',
			preload: 'Loading...',
			error: 'There has been a problem attempting to loading the image.'
		};

		this.options = $.extend(defaults, options);

		var self = this,
		    loaded = false,
		    found = true,
		    timeout,
		    w1,w2,w3,w4,
		    h1,h2,h3,h4,
		    rw,rh,
		    over = false;

		function init()
		{
			// DOM elements
			self.elements = {
				$target: $(target),
				$source: $('img', target),
				$parent: $(self.options.parent)
			};

			change(self.elements.$target.attr('href'));

			// Bind events to target
			self.elements.$target
				.css('cursor', 'crosshair')
				.on('click', function(e)
				{
					e.preventDefault();
				})
				.on('mouseover', function(e)
				{
					start(e);
				})
				.on('mouseout', function()
				{
					self.hide();
				})
				.on('mousemove', function(e)
				{
					move(e);
				});
		}

		function change(href)
		{
			// Load zoomed image
			self.elements.$zoomed = self.load(href).on('error', function()
				{
					found = false;
				})
				.on('load', function()
				{
					loaded = true;

					$(this).off('load');
				});
		}
		
		function start(e)
		{
			self.hide();

			self.elements.$panel = $('<div id="' + self.options.id + '">' + self.options.preload + '</div>').appendTo(self.elements.$parent);

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

		function error()
		{
			self.elements.$panel.html(self.options.error);
		}

		function move(e)
		{
			if (over)
			{
				// target image movement
				var p = self.elements.$source.offset(),
				    pl = e.pageX - p.left,
				    pt = e.pageY - p.top,
				    xl = pl * rw,
				    xt = pt * rh;

				xl = (xl > w4) ? w4 : xl;
				xt = (xt > h4) ? h4 : xt;

				self.elements.$zoomed.css({'left':xl * (-1),'top':xt * (-1)});
			}
		}

		function show(e)
		{
			over = true;

			self.elements.$zoomed
				.css({'position':'absolute','top':'0','left':'0'})
				.appendTo(self.elements.$panel);

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

		// Public methods
		this.load = function(href)
		{
			var img = new Image();

			img.src = href + '?' + (new Date()).getTime();
			img.onload = function()
			{
				img = null; // Clear memory
			};

			return $(img);
		};

		this.hide = function()
		{
			over = false;

			if (self.elements.$panel)
			{
				self.elements.$panel
					.remove()
					.html('');
			}
		};

		this.update = function(href)
		{
			this.hide();

			loaded = false;

			change(href);
		};

		// Works only for anchors
		if (target.tagName.toLowerCase() === 'a')
		{
			init(); // Call init at runtime to avoid compile time scope issues.
		}
		
		return this;
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
			    source = $this.attr('rel');

			// Load new source image
			self.load(source).on('load', function()
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
