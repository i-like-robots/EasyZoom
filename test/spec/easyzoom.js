(function() {

    var api, $easyzoom;

    var lifecycle = {
        setup: function() {
            $easyzoom = $(".easyzoom").easyZoom();
            api = $easyzoom.data("easyZoom");
        },
        teardown: function() {
            api.teardown();
            $easyzoom.removeData("easyZoom");
        }
    };

    module("Setup", lifecycle);

    test("$(collection).easyZoom()", function() {

        ok(api.$link.length, "Zoom link is found");
        ok(api.$image.length, "Smaller image is found");
        ok(api.opts.inlineOption, "Data attributes can be options");
        ok(api.hasOwnProperty("$flyout"), "Flyout is created");
        ok(api.hasOwnProperty("$notice"), "Notice is created");

        var events = $._data(api.$target.get(0), "events");

        equal($.isEmptyObject(events), false, "Mouse and touch events bound to target");

    });

    test("API", function() {

        equal(typeof api, "object", "API is available");
        equal($.isEmptyObject(api), false, "API has returned methods");

    });

    module("API", lifecycle);

    asyncTest(".show()", function() {

        expect(2);

        api.opts.onShow = function() {

            equal(api.isOpen, true, "Open flag is set to true");
            equal(api.$flyout.parent().length, 1, "Flyout appended to DOM");

            start();
        };

        api.isMouseOver = true;

        api.show();

    });

    asyncTest(".show(e)", function() {

        expect(2);

        var mock = {
            type: "mousemove",
            pageX: 0,
            pageY: 0
        };

        var stub = sinon.stub(api, "_move", function(e) {

            equal(stub.calledOnce, true, "Internal ._move() method called when .show() is provided with an event");
            equal(e, mock, "Internal ._move() method called with event passed to .show()");

            stub.restore();

            start();
        });

        api.isMouseOver = true;

        api.show(mock);

    });

    asyncTest(".hide()", function() {

        expect(2);

        api.opts.onShow = function() {
            api.hide();
        };

        api.opts.onHide = function() {

            equal(api.isOpen, false, "Open flag set to false");
            equal(api.$flyout.parent().length, 0, "Flyout detached from DOM");

            start();
        };

        api.show();

    });

    asyncTest(".swap()", function() {

        expect(6);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";

        api.swap(standard, zoom);

        equal(api.$target.hasClass("is-loading"), false, "'Loading' state class has been removed");
        equal(api.$target.hasClass("is-ready"), false, "'Ready' state class has been removed");
        equal(api.$target.hasClass("is-error"), false, "'Error' state class has been removed");
        equal(api.$image.attr("src"), standard, "Standard image SRC changed");
        equal(api.$link.attr("href"), zoom, "Zoom image HREF changed");

        api.opts.onShow = function() {
            equal(api.$zoom.attr("src"), zoom, "Zoom image loaded with new SRC");
            start();
        };

        api.isMouseOver = true;

        api.show();

    });

    test(".swap(standard, zoom, srcsetString)", function() {

        expect(1);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";
        var srcsetString = "../example-images/test_standard.jpg 1x, ../example-images/test_zoom.jpg 2x";

        api.swap(standard, zoom, srcsetString);

        equal(api.$image.attr("srcset"), srcsetString, "Standard image SRCSET changed");

    });

    test(".swap(standard, zoom, srcsetArray)", function() {

        expect(1);

        var standard = "../example-images/test_standard.jpg";
        var zoom = "../example-images/test_zoom.jpg";
        var srcsetArray = ['../example-images/test_standard.jpg 1x', '../example-images/test_zoom.jpg 2x'];
        var srcsetString = '../example-images/test_standard.jpg 1x,../example-images/test_zoom.jpg 2x';

        api.swap(standard, zoom, srcsetArray);

        equal(api.$image.attr("srcset"), srcsetString, "Standard image SRCSET changed");

    });

    test(".teardown()", function() {

        api.teardown();

        equal(api.isOpen, undefined, "Open flag unset");
        equal(api.isReady, undefined, "Ready flag unset");

        equal(api.$target.hasClass("is-ready"), false, "Ready class removed from target");
        equal(api.$target.hasClass("is-error"), false, "Error class removed from target");
        equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

        equal($._data(api.$target.get(0), "events"), undefined, "Mouse and touch events removed from target");

    });

    module("Internals", lifecycle);

    asyncTest("._loadImage(path, callback)", function() {

        expect(5);

        api._loadImage(api.$link.attr("href"), function() {

            equal(api.isReady, true, "Ready flag set to true");
            equal(api.$notice.parent().length, 0, "Loading notice detached from DOM");
            equal(api.$target.hasClass("is-loading"), false, "Loading class removed from target");

            start();
        });

        equal(api.$target.hasClass("is-loading"), true, "Loading class added to target");
        equal(api.$notice.parent().length, 1, "Loading notice appended to DOM");

    });

    asyncTest("._loadImage(404)", function() {

        expect(3);

        api.opts.errorDuration = 100;
        api._loadImage("404.jpg");

        api.$zoom.on("error", function() {

            equal(api.$notice.parent().length, 1, "Error notice appended to DOM");
            equal(api.$target.hasClass("is-error"), true, "Error class added to target");

            setTimeout(function() {
                equal(api.$notice.parent().length, 0, "Error notice removed from DOM");
                start();
            }, 100);

        });

    });

    asyncTest("_move(e)", function() {

        expect(5);

        var offset = api.$target.position();

        var mock_1 = {
            type: "mousemove",
            pageX: offset.left + 10,
            pageY: offset.top + 10
        };

        var mock_2 = {
            type: "mousemove",
            pageX: offset.left + 100,
            pageY: offset.top + 100
        };

        var mock_3 = {
            type: "mousemove",
            pageX: offset.left - 10,
            pageY: offset.top - 10
        };

        var spy = sinon.spy(api, "hide");

        // Must open the flyout with a zoom image first
        api.opts.onShow = function() {
            var left, top;

            api._move(mock_1);

            left = parseInt(api.$zoom.css("left"), 10);
            top = parseInt(api.$zoom.css("top"), 10);

            equal(left, -20, "2x scale zoom image moved 20px left given 10px offset");
            equal(top, -20, "2x scale zoom image moved 20px top given 10px offset");

            api._move(mock_2);

            left = parseInt(api.$zoom.css("left"), 10);
            top = parseInt(api.$zoom.css("top"), 10);

            equal(left, -200, "2x scale zoom image moved 200px left given 100px offset");
            equal(top, -200, "2x scale zoom image moved 200px top given 100px offset");

            api._move(mock_3);

            equal(spy.calledOnce, true, ".hide() is called if event is outside");

            start();
        };

        api.isMouseOver = true;

        api.show();

    });

})();
